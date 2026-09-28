/** npx tsx --test training/qwen/pipeline.test.ts */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scrub } from './dataset-utils'
import { score } from './eval'

test('export drops identifier fields and masks identifiers embedded in text', () => {
  const s = scrub({ address: '625 Irvin Ave', email: 'a@b.c', intake: { location: 'Deale, MD', note: 'Site at 625 Irvin Ave; call (301) 555-0199 or owner@example.com.', squareFeet: 180 } })
  assert.equal((s as any).address, undefined)
  assert.equal((s as any).email, undefined)
  assert.equal((s as any).intake.location, 'Deale, MD')
  assert.equal((s as any).intake.note, 'Site at [address]; call [phone] or [email].')
  assert.equal((s as any).intake.squareFeet, 180)
})

test('eval scores JSON, keys, numbers and the rewrite guard', () => {
  const bot = { messages: [{ role: 'system', content: 's' }, { role: 'user', content: 'u' }, { role: 'assistant', content: '{"costLow":23361,"costHigh":167964,"byTrade":{}}' }], meta: { kind: 'bot', botType: 'estimate' } }
  assert.deepEqual(score(bot, '{"costLow":23361,"costHigh":167964,"byTrade":{}}'), { json_valid: 1, key_recall: 1, number_fidelity: 1, number_guard: null })
  assert.equal(score(bot, '{"costLow":20000}').number_fidelity, 0)
  const polish = { messages: [{ role: 'system', content: 's' }, { role: 'user', content: 'Priced at $64,767.' }, { role: 'assistant', content: 'At $64,767.' }], meta: { kind: 'assist', task: 'narrative_polish:estimate.narrative' } }
  assert.equal(score(polish, 'It costs $64,767.').number_guard, 1)
  assert.equal(score(polish, 'It costs about $65,000.').number_guard, 0)
})
