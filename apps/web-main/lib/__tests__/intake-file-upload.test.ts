import { afterEach, describe, expect, it, vi } from 'vitest'
import { classifyIntakeFileType, uploadIntakeFilesSequentially } from '../intake-file-upload'

afterEach(() => vi.unstubAllGlobals())

describe('intake evidence classification', () => {
  it('keeps mobile walkthrough video as video evidence', () => {
    const file = new File(['video'], 'walkthrough.mov', { type: 'video/quicktime' })
    expect(classifyIntakeFileType(file)).toBe('video')
  })

  it('keeps plans and drawings as documents', () => {
    const file = new File(['plan'], 'permit-plan.pdf', { type: 'application/pdf' })
    expect(classifyIntakeFileType(file)).toBe('document')
  })

  it.each(['', 'application/octet-stream'])('recognizes photos without usable MIME metadata (%s)', type => {
    expect(classifyIntakeFileType(new File(['photo'], 'ROOM.HEIC', { type }))).toBe('image')
    expect(classifyIntakeFileType(new File(['video'], 'room.mov', { type }))).toBe('video')
  })
})

describe('intake upload recovery', () => {
  it('sends a recognized MIME type for a generic photo', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ urls: ['https://storage/room.png'] }))
    vi.stubGlobal('fetch', fetchMock)
    const result = await uploadIntakeFilesSequentially([new File(['photo'], 'room.png', { type: 'application/octet-stream' })])
    const body = fetchMock.mock.calls[0][1].body as FormData
    expect((body.get('files') as File).type).toBe('image/png')
    expect(result).toEqual([{ name: 'room.png', url: 'https://storage/room.png', type: 'image' }])
  })

  it('keeps successful files when another upload fails and continues the batch', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(Response.json({ urls: ['https://storage/first.png'] }))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(Response.json({ urls: ['https://storage/last.pdf'] })))
    const onError = vi.fn()
    const result = await uploadIntakeFilesSequentially([
      new File(['photo'], 'first.png'), new File(['photo'], 'failed.png'), new File(['plan'], 'last.pdf'),
    ], onError)
    expect(result.map(file => file.name)).toEqual(['first.png', 'last.pdf'])
    expect(onError).toHaveBeenCalledWith('failed.png: Failed to fetch')
  })

  it.each([
    [400, { error: 'Unsupported file type' }, 'Unsupported file type'],
    [200, { urls: [] }, 'did not return a file'],
  ])('surfaces unusable responses (%s)', async (status, body, message) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(body, { status })))
    const onError = vi.fn()
    expect(await uploadIntakeFilesSequentially([new File(['file'], 'room.png')], onError)).toEqual([])
    expect(onError).toHaveBeenCalledWith(expect.stringContaining(message))
  })

  it('reports a timeout so the user can retry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('Timeout', 'TimeoutError')))
    const onError = vi.fn()
    await uploadIntakeFilesSequentially([new File(['photo'], 'room.png')], onError)
    expect(onError).toHaveBeenCalledWith('room.png: Upload timed out. Please try again.')
  })
})
