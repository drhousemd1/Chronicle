## Supabase Tables

### Where Codex must look before working with Supabase

Chronicle’s live Supabase project is hosted and controlled through Lovable. Codex agents cannot directly inspect or modify the live project. The Supabase Schema Reference linked below is the Codex-accessible record of the project’s last synchronized documented structure. It exists so agents can inspect the backend details that Lovable has recorded instead of inventing table names, columns, relationships, policies, functions, or other Supabase behavior. It is not proof that every live database detail is represented or unchanged.

**Reference page:** [`/style-guide/supabase-schema-reference`](/style-guide/supabase-schema-reference)

**Reference source:** `/src/data/supabase-schema-reference.ts`

### Supabase access and verification requirement

The linked Supabase Schema Reference must be inspected during any audit, code review, implementation plan, or code change involving Supabase or Supabase-dependent application code. Verify each needed fact against what the reference actually documents. Do not treat the reference as if it contains definitions it does not show, and do not invent or infer table names, columns, data types, relationships, constraints, indexes, RLS policies, functions/RPCs, triggers, or storage configuration from repository code alone.

If work requires a change to the live Supabase project, the plan must include an explicit Lovable handoff describing the required database changes. Lovable—or the user through Lovable’s interface—must apply those changes. The same handoff must require Lovable to update the Supabase Schema Reference after the live changes are made so the Codex-accessible reference remains synchronized. Anything that cannot be verified through the reference or by Lovable must be identified as unverified rather than guessed.
