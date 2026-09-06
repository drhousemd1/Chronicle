## Supabase Tables

### Where the documented Supabase structure lives

Chronicle’s live Supabase project is hosted and controlled through Lovable. Codex agents cannot directly inspect or modify the live project. The Supabase Schema Reference linked below is the Codex-accessible record of the project’s last synchronized documented structure. It exists so agents can inspect the backend details that Lovable has recorded instead of inventing table names, columns, relationships, policies, functions, or other Supabase behavior. It is not proof that every live database detail is represented or unchanged.

**Reference page:** [`/style-guide/supabase-schema-reference`](/style-guide/supabase-schema-reference)

**Reference source:** `/src/data/supabase-schema-reference.ts`

### Reference and live-system mechanics

Chronicle Work Manual: docs/architecture-knowledge/chronicle-work-manual.md
Chronicle Work Manual version: 0.2.2-provisional

This page supplies reference and handoff mechanics; it does not decide when a Chronicle task requires Supabase inspection, live verification, Lovable, a plan, or a record. When the Work Manual or the user selects those mechanics, verify each needed fact against what the linked reference actually documents. Do not treat the reference as if it contains definitions it does not show, and identify anything that cannot be verified as unverified rather than guessing.

When an authorized task changes the live Supabase project through Lovable, the handoff must also update the Supabase Schema Reference after the live change so Chronicle's documented reference remains synchronized. The reference update records what Lovable reports; it does not by itself prove every live database detail.
