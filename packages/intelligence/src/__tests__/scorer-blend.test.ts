import { describe, it, expect } from 'vitest'
import { priorityToRoutingTag, blendLeadScores } from '../scoring/intake-blend.js'

describe('intake score blending', () => {
  it('maps immediate priority to hot', () => {
    expect(priorityToRoutingTag('immediate')).toBe('hot')
  })

  it('maps suppress to nurture', () => {
    expect(priorityToRoutingTag('suppress')).toBe('nurture')
  })

  it('blends legacy and intelligence scores', () => {
    expect(blendLeadScores(60, 90)).toBe(80)
  })
})
