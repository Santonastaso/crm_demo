# GitHub Pages Deployment Guide

## Overview

This project uses GitHub Actions to automatically build and deploy to GitHub Pages whenever code is pushed to the `main` branch.

## Workflow File

Location: `.github/workflows/pages.yml`

## Common Issues and Solutions

### 1. Native Module Errors (npm bug #4828)

**Symptoms:**
```
Error: Cannot find module @rollup/rollup-linux-x64-gnu
Error: Cannot find module '../lightningcss.linux-x64-gnu.node'
Error: Failed to load native binding @tailwindcss/oxide
Error: Cannot find module '@swc/html-linux-x64-gnu'
```

**Root Cause:**
npm has a bug where optional dependencies for platform-specific native modules aren't installed correctly on CI environments.

**Solution:**
Add the Linux x64 GNU variants explicitly to `optionalDependencies` in `package.json`:

```json
"optionalDependencies": {
  "@rollup/rollup-linux-x64-gnu": "4.52.5",
  "@swc/html-linux-x64-gnu": "1.14.0",
  "@tailwindcss/oxide-linux-x64-gnu": "4.1.16",
  "lightningcss-linux-x64-gnu": "1.30.2"
}
```

Also remove `--prefer-offline` flag from `npm install` in the workflow to ensure fresh dependency fetching.

### 2. Local Dependencies Not Found

**Symptoms:**
```
[vite]: Rollup failed to resolve import "@santonastaso/shared/styles.css"
Module not found: Can't resolve 'file:../shared'
```

**Root Cause:**
Local file dependencies (e.g., `"@santonastaso/shared": "file:../shared"`) don't exist in the CI environment.

**Solutions:**
- Option A: Publish the shared package to npm and use version-based dependency
- Option B: Inline the shared code directly into the project (recommended for dead packages)
- Option C: Use a monorepo tool like npm workspaces or pnpm

### 3. Branch Protection Rules

**Symptoms:**
```
Branch "consolidation" is not allowed to deploy to github-pages due to environment protection rules
```

**Solution:**
Either:
- Merge your branch into `main` and push `main`
- Update `.github/workflows/pages.yml` to trigger on your branch:
  ```yaml
  on:
    push:
      branches: [ main, your-branch-name ]
  ```

### 4. Missing Permissions

**Symptoms:**
```
HTTP 403: Must have admin rights to Repository
```

**Root Cause:**
Trying to use `gh workflow run` (manual trigger) without admin rights.

**Solution:**
Use automatic triggers via `git push` instead of manual workflow dispatch.

### 5. Runtime Errors on Deployed Site

#### AuthApiError: Invalid Refresh Token

**Cause:**
Supabase authentication tokens stored in localStorage from local development don't work on the deployed site.

**Solution:**
Clear browser localStorage or use incognito mode to test the deployed site.

#### NaN in SVG Attributes

**Symptoms:**
```
Error: <rect> attribute height: Expected length, "NaN"
Error: <g> attribute transform: Trailing garbage, "translate(130, NaN)"
```

**Cause:**
Chart components rendering with empty/undefined data.

**Solution:**
Add null checks before rendering charts:
```typescript
if (!data || data.length === 0) return null;
```

And null-coalesce numeric values:
```typescript
const total = items.reduce((sum, item) => sum + (item.amount || 0), 0);
```

#### Dark/Light Theme Not Working

**Cause:**
Missing CSS variables from external stylesheet.

**Solution:**
Inline the CSS variables directly into `src/index.css` instead of importing from external packages.

## Deployment Process

### Automatic Deployment (Recommended)

1. Make your changes
2. Commit and push to `main`:
   ```bash
   git add -A
   git commit -m "Your commit message"
   git push origin main
   ```
3. GitHub Actions automatically builds and deploys
4. Check progress: https://github.com/Santonastaso/crm_demo/actions
5. Site live at: https://santonastaso.github.io/crm_demo/

### Manual Deployment (If Needed)

```bash
# Build locally first to catch errors
npm run build

# If build succeeds, commit and push
git add -A
git commit -m "Your changes"
git push origin main
```

## Monitoring Deployment

```bash
# View recent workflow runs
gh run list --workflow=pages.yml --limit 5

# Watch a specific run
gh run watch <run-id>

# View logs if failed
gh run view <run-id> --log
```

## Troubleshooting Checklist

When deployment fails:

1. ✅ Check if it's a native module error → Add to `optionalDependencies`
2. ✅ Check for local file dependencies → Inline or publish them
3. ✅ Verify branch is allowed to deploy → Use `main` or update workflow
4. ✅ Test build locally first → Run `npm run build`
5. ✅ Check GitHub Actions logs → Look for specific error messages
6. ✅ Verify all imports resolve → No missing packages
7. ✅ Check for runtime errors → Add null checks for data

## Configuration Files

### package.json
- Contains `optionalDependencies` for native modules
- Build script: `"build": "tsc && vite build"`

### .github/workflows/pages.yml
- Triggers on push to `main` branch
- Uses Node.js 20.x
- Runs `npm install` and `npm run build`
- Deploys to GitHub Pages

### vite.config.ts
- Base path: `/crm_demo/` (matches repo name)
- Build output: `dist/`

## Best Practices

1. **Always test locally first**: Run `npm run build` before pushing
2. **Use automatic triggers**: Avoid manual workflow dispatch
3. **Keep dependencies up to date**: But pin versions for native modules
4. **Add null checks**: Especially for data from APIs
5. **Clear browser cache**: When testing deployed changes
6. **Use incognito mode**: To avoid localStorage conflicts

## Quick Reference

```bash
# Local build
npm run build

# Commit and deploy
git add -A && git commit -m "message" && git push origin main

# Check deployment status
gh run list --workflow=pages.yml --limit 1

# View site
open https://santonastaso.github.io/crm_demo/
```

## Notes

- Deployment typically takes 1-2 minutes
- The site uses the `gh-pages` branch for hosting (auto-managed)
- Environment variables from `.env` are NOT available in production
- All API calls must work with public endpoints or handle auth properly
