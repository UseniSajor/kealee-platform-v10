# Voice and Customer Data Security

Twilio HTTP and WebSocket requests require valid signatures using the exact externally visible URL. The setup account SID must match configured account ownership. Credentials never enter clients.

Voice artifacts store redacted content and hashes. Card-like digit sequences are removed before agent context, persistence, or speech output. Raw card data must be redirected to a hosted payment link. Recordings/transcripts require explicit RBAC, tenant/project checks, encryption-key identifiers, and retention expiry.

Project status and support APIs authorize owner or project membership before querying any project data. Supabase service-role credentials are server-only. Public/exposed tables require ownership-based RLS; authenticated role alone is insufficient authorization.

AI cannot guarantee permits, represent GIS as a survey, make regulated professional determinations, apply a signature/seal, or release regulated work. Consequential state transitions use expected versions, idempotency keys, append-only events, and professional/human gates.

Logs allow correlation/provider IDs, outcome, duration, and error codes. They exclude phone/email, raw transcript, property-sensitive payloads, card data, auth tokens, provider credentials, and sealed document contents.
