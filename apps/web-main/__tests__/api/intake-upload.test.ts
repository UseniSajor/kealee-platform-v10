import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const storage = vi.hoisted(() => ({ upload: vi.fn(), getPublicUrl: vi.fn() }))
vi.mock('@/lib/supabase-server', () => ({
  getSupabaseAdmin: () => ({ storage: { from: () => storage } }),
}))
import { POST } from '@/app/api/intake/upload/route'

function request(file: File | string) {
  const body = new FormData()
  body.append('files', file)
  return new NextRequest('http://localhost/api/intake/upload', { method: 'POST', body })
}

beforeEach(() => {
  vi.clearAllMocks()
  storage.upload.mockResolvedValue({ error: null })
  storage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://storage/upload' } })
})

describe('intake upload file metadata', () => {
  it.each(['photo.JPG', 'photo.png', 'photo.HEIC', 'photo.heif', 'plan.pdf', 'walkthrough.mov'])('accepts generic binary metadata for %s', async name => {
    const response = await POST(request(new File(['content'], name, { type: 'application/octet-stream' })))
    expect(response.status).toBe(200)
    expect((await response.json()).urls).toEqual(['https://storage/upload'])
    expect(storage.upload.mock.calls[0][2].contentType).not.toBe('application/octet-stream')
  })

  it('rejects unknown binary files', async () => {
    const response = await POST(request(new File(['content'], 'program.exe', { type: 'application/octet-stream' })))
    expect(response.status).toBe(400)
    expect(storage.upload).not.toHaveBeenCalled()
  })

  it('rejects text form fields instead of crashing', async () => {
    const response = await POST(request('not a file'))
    expect(response.status).toBe(400)
    expect(storage.upload).not.toHaveBeenCalled()
  })
})
