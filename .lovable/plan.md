
## Update GITHUB_PAT Secret

**What will happen:**
1. Use the add_secret tool to present the input prompt where you can securely paste your newly generated GitHub Personal Access Token (the one with **Contents: Read and write** permission).
2. Once the secret is updated, optionally test the sync by invoking the edge function to confirm the 403 error is resolved.

**No code changes needed** -- this is purely a secret value update.
