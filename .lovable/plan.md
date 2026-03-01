

## Dual-Save: Database + GitHub Repo Files

### How it works
When you click **Save** in the App Guide editor, two things happen simultaneously:
1. The document saves to the database (as it does today)
2. A backend function commits/updates a `.md` file in your GitHub repo under `docs/guides/`

Claude (or any tool reading your repo) will always see the latest version of each guide document.

### What you need to provide
- A **GitHub Personal Access Token** (classic) with `repo` scope -- this lets the backend function push commits to your repository
- You can create one at github.com > Settings > Developer Settings > Personal Access Tokens

### Implementation steps

**1. Create the backend function `sync-guide-to-github`**
- Accepts: `{ title, markdown, filename }` 
- Uses the GitHub Contents API (`PUT /repos/{owner}/{repo}/contents/{path}`) to create or update a file
- Converts the title to a slug for the filename (e.g., "Character Builder Page" becomes `docs/guides/character-builder-page.md`)
- Gets the file's current SHA first (required by GitHub API for updates), then commits the new content
- Uses the stored GitHub token for authentication

**2. Store the GitHub token as a secret**
- Secret name: `GITHUB_PAT`
- Also need repo owner/name -- these can be stored as secrets or hardcoded in the function since they're not sensitive

**3. Update the save flow in `AppGuideTool.tsx`**
- After the successful database save, call the backend function with the document title and markdown
- The GitHub sync is fire-and-forget (don't block the UI on it)
- Log success/failure to console

**4. Handle delete sync**
- When a document is deleted, also call the backend function to delete the corresponding file from the repo

### File changes

| File | Change |
|------|--------|
| `supabase/functions/sync-guide-to-github/index.ts` | New backend function that commits markdown files to GitHub |
| `supabase/config.toml` | Register the new function with `verify_jwt = false` |
| `src/components/admin/guide/AppGuideTool.tsx` | Add GitHub sync calls after database save/delete |

### Technical details

The backend function will:
- Slugify the document title for the filename
- Call `GET /repos/{owner}/{repo}/contents/docs/guides/{slug}.md` to get the current SHA (if file exists)
- Call `PUT /repos/{owner}/{repo}/contents/docs/guides/{slug}.md` with base64-encoded markdown content and the SHA
- For deletes, call `DELETE /repos/{owner}/{repo}/contents/docs/guides/{slug}.md`
- Return success/failure status

The GitHub sync runs after the database save succeeds, so even if the GitHub push fails, your data is safe in the database. Console logs will indicate sync status.
