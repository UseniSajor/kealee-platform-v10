import { describe, expect, it } from 'vitest'
import { classifyIntakeFileType } from '../intake-file-upload'

describe('intake evidence classification', () => {
  it('keeps mobile walkthrough video as video evidence', () => {
    const file = new File(['video'], 'walkthrough.mov', { type: 'video/quicktime' })
    expect(classifyIntakeFileType(file)).toBe('video')
  })

  it('keeps plans and drawings as documents', () => {
    const file = new File(['plan'], 'permit-plan.pdf', { type: 'application/pdf' })
    expect(classifyIntakeFileType(file)).toBe('document')
  })
})
