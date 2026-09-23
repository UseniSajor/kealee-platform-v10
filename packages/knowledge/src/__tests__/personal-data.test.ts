/**
 * These tests are the technical control behind the privacy position. They are
 * about what CANNOT get into the corpus, so the failure mode they guard is
 * data arriving there because nobody thought about it.
 */
import { describe, it, expect } from 'vitest'
import {
  FIELD_POLICIES, RETENTION_RULES, policyFor, unclassified, admitToCorpus,
} from '../policies/personal-data'

const hash = (v: string) => `h_${v.length}_${v.slice(0, 2)}`
const generalise = (field: string, value: unknown) =>
  field === 'address' ? null : value

describe('field classification', () => {
  it('never admits a directly identifying field', () => {
    for (const f of ['contactEmail', 'clientName', 'contactPhone', 'reviewerName', 'licenceNumber']) {
      const p = policyFor(f)!
      expect(p.dataClass, f).toBe('PERSONAL')
      expect(p.corpusEligible, `${f} must not be corpus eligible`).toBe(false)
    }
  })

  it('admits the engineering material that actually improves a plan', () => {
    for (const f of ['zoneCode', 'setbacks', 'qcFindings', 'redlineComment', 'sheetGeometry']) {
      expect(policyFor(f)!.corpusEligible, f).toBe(true)
    }
  })

  it('keeps the redline but drops who wrote it', () => {
    // The decision is the signal. The professional is a person.
    expect(policyFor('redlineComment')!.corpusEligible).toBe(true)
    expect(policyFor('reviewerName')!.corpusEligible).toBe(false)
  })

  it('gives every policy a reason a human can audit', () => {
    for (const p of FIELD_POLICIES) {
      expect(p.reason.length, p.field).toBeGreaterThan(20)
    }
  })
})

describe('admission to the corpus', () => {
  const record = {
    contactEmail: 'someone@example.com',
    clientName: 'A Person',
    orderId: 'ord_12345',
    address: '1005 Rollins Ave',
    zoneCode: 'RSF-65',
    parcelAreaSqFt: 9596,
    qcFindings: ['coverage within limit'],
    redlineComment: 'Driveway apron exceeds 20 ft at the right of way.',
    reviewerName: 'A Licensed Engineer',
  }

  it('drops every personal field and keeps every engineering one', () => {
    const r = admitToCorpus(record, hash, generalise)
    expect(r.admitted).not.toHaveProperty('contactEmail')
    expect(r.admitted).not.toHaveProperty('clientName')
    expect(r.admitted).not.toHaveProperty('reviewerName')
    expect(r.admitted).not.toHaveProperty('address')
    expect(r.admitted.zoneCode).toBe('RSF-65')
    expect(r.admitted.redlineComment).toMatch(/Driveway apron/)
  })

  it('hashes the order id so two records about one job still relate', () => {
    const r = admitToCorpus(record, hash, generalise)
    expect(r.admitted).not.toHaveProperty('orderId')
    expect(r.admitted.orderIdHash).toBe(hash('ord_12345'))
    expect(r.hashed).toContain('orderId')
  })

  it('drops an UNKNOWN field by default and reports it', () => {
    // The default that matters: a new field on the deliverable cannot reach
    // the corpus by accident. It shows up as a governance task.
    const r = admitToCorpus({ ...record, newUnthoughtOfField: 'maybe sensitive' }, hash, generalise)
    expect(r.admitted).not.toHaveProperty('newUnthoughtOfField')
    expect(r.unclassified).toEqual(['newUnthoughtOfField'])
    expect(unclassified(['newUnthoughtOfField', 'zoneCode'])).toEqual(['newUnthoughtOfField'])
  })

  it('leaks nothing identifying into the admitted record, checked by value', () => {
    const r = admitToCorpus(record, hash, generalise)
    const blob = JSON.stringify(r.admitted)
    for (const secret of ['someone@example.com', 'A Person', '1005 Rollins', 'A Licensed Engineer']) {
      expect(blob, `"${secret}" reached the corpus`).not.toContain(secret)
    }
  })
})

describe('retention', () => {
  it('has a rule for every store the corpus touches', () => {
    const stores = RETENTION_RULES.map(r => r.store).join(' ')
    expect(stores).toMatch(/knowledge_artifacts/)
    expect(stores).toMatch(/rag_documents/)
    expect(stores).toMatch(/learning_events/)
  })

  it('refuses erasure of a professional record WITH a stated reason', () => {
    // Refusing quietly is the failure. Refusing with a reason is practice.
    const docs = RETENTION_RULES.find(r => r.store.startsWith('documents'))!
    expect(docs.onErasureRequest).toBe('retain_with_reason')
    expect(docs.reason).toMatch(/professional/i)
  })

  it('deletes the retrieval corpus outright on erasure, because it is rebuildable', () => {
    const rag = RETENTION_RULES.find(r => r.store.startsWith('rag_documents'))!
    expect(rag.onErasureRequest).toBe('delete')
  })

  it('states a lawful basis for every store', () => {
    for (const r of RETENTION_RULES) expect(r.basis, r.store).toBeTruthy()
  })
})
