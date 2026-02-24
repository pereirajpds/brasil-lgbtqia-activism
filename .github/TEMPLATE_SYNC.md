---
layout: base
title: Template Sync Strategy
date: 2025-12-23
---

# Template Sync Strategy

This document explains how Xanthan's core files are automatically synced to template repositories, keeping all templates up-to-date without manual maintenance.

## Overview

Xanthan uses GitHub Actions to automatically sync core files to template repositories whenever changes are committed to the main branch. This ensures that:

- All templates inherit bug fixes and improvements to includes, layouts, and styles
- Templates stay in sync without manual file copying
- Template maintainers only need to update template-specific content (homepage, starter pages, navigation)

## What Gets Synced (Core)

The following directories and files sync automatically to all templates:

- `_includes/` — All reusable components (figure.html, carousel.html, etc.)
- `_layouts/` — All page templates (base.html, scrollstory.html, etc.)
- `assets/css/` — All stylesheets (except `sidebar.css` for portfolio-template)
- `assets/js/` — All JavaScript files
- `assets/images/backgrounds/` — Shared background images (preserves template-specific images)
- `docs/` — Complete documentation (except `docs/index.md` which stays template-specific)
- `scrollstories/` — ScrollStory documentation and examples
- `Gemfile` — Ruby dependencies
- `.gitignore` — Git ignore rules
- `CHANGELOG.md` — Synced as `XANTHAN_CHANGELOG.md` in templates

## What Stays Template-Specific

These items **do not sync** and remain unique to each template:

- `index.md` — Custom homepage
- `docs/index.md` — Template-specific documentation landing page
- `_data/` — Template-specific navigation and data files
- `_config.yml` — Template-specific configuration (baseurl, title, description)
- Template-specific images in `assets/images/` (backgrounds sync, others don't)
- Starter/example pages (e.g., portfolio examples, scrollstory sample)
- `README.md` — Template-specific setup instructions
- `instructions.md` — Template-specific quick-start guide

## How It Works

### Automatic Sync

1. Developer commits changes to xanthan's `main` branch (in watched paths: `_includes/`, `_layouts/`, `assets/`, `docs/`, `scrollstories/`, `Gemfile`, `.gitignore`, `_config.yml`)
2. GitHub Actions workflow triggers automatically
3. For each template:
   - Checks out latest xanthan code
   - Checks out the template repository
   - Syncs core files using `rsync` with `--delete` (removes files that no longer exist in xanthan)
   - Creates detailed commit message with SHA and change stats
   - Commits with message starting with `"chore: sync core files from xanthan [skip ci]"`
   - Pushes to template repository

### Manual Trigger

You can also trigger syncs manually from the Actions tab with these options:

- **Dry run** — Preview changes without actually pushing (shows diff stats)
- **Specific template** — Sync only one template instead of all (`portfolio`, `scrollstory`, `class-project`, or `all`)

The `[skip ci]` tag prevents cascading workflow runs on template repos.

## Setup Requirements

### Personal Access Token (PAT)

The workflow requires a GitHub token with write access to all template repositories:

1. Generate a classic PAT at https://github.com/settings/tokens with `repo` scope
2. Add it as a secret named `SYNC_TOKEN` in the xanthan repository settings
3. Ensure this token has push access to all template repos

### Template Repository Access

Each template repository must grant the `xanthan-web` organization (or the token owner) write access.

## Adding a New Template

To sync a new template:

1. Create the template repository (e.g., `academic-template`)
2. Manually populate template-specific files:
   - Custom `index.md`
   - Custom `_data/top-nav.yml`
   - Custom `_config.yml` (adjust baseurl to `/academic-template/`)
   - Any starter example pages
3. Add a new job to `.github/workflows/sync-templates.yml`:

```yaml
sync-academic-template:
  if: github.event.inputs.template == 'all' || github.event.inputs.template == 'academic' || github.event.inputs.template == ''
  runs-on: ubuntu-latest
  steps:
    - name: Checkout xanthan main
      uses: actions/checkout@v4
      with:
        path: xanthan-source

    - name: Checkout academic-template
      uses: actions/checkout@v4
      with:
        repository: xanthan-web/academic-template
        token: ${{ secrets.SYNC_TOKEN }}
        path: academic-template

    - name: Sync core files to academic-template
      run: |
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Syncing to academic-template"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

        # Sync complete code libraries
        rsync -av --delete xanthan-source/_includes/ academic-template/_includes/
        rsync -av --delete xanthan-source/_layouts/ academic-template/_layouts/
        rsync -av --delete xanthan-source/assets/css/ academic-template/assets/css/
        rsync -av --delete xanthan-source/assets/js/ academic-template/assets/js/
        rsync -av --delete xanthan-source/scrollstories/ academic-template/scrollstories/
        rsync -av --delete --exclude='index.md' xanthan-source/docs/ academic-template/docs/

        # Sync shared background images
        rsync -av --delete xanthan-source/assets/images/backgrounds/ academic-template/assets/images/backgrounds/ 2>/dev/null || true

        # Sync dependency files
        cp xanthan-source/Gemfile academic-template/Gemfile
        cp xanthan-source/.gitignore academic-template/.gitignore
        cp xanthan-source/CHANGELOG.md academic-template/XANTHAN_CHANGELOG.md

        echo "✓ Synced core files to academic-template"

        cd academic-template
        git status -s

    - name: Create PR or push changes
      run: |
        cd academic-template

        if [[ -z $(git status -s) ]]; then
          echo "✓ No changes to commit"
          exit 0
        fi

        # Dry run mode - just show what would be committed
        if [[ "${{ github.event.inputs.dry_run }}" == "true" ]]; then
          echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
          echo "DRY RUN - Would commit these changes:"
          echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
          git diff --stat
          exit 0
        fi

        git add -A

        # Create detailed commit message
        COMMIT_MSG="chore: sync core files from xanthan

        Synced from xanthan commit: ${{ github.sha }}

        Changes:
        $(git diff --cached --stat)

        [skip ci]"

        git commit -m "$COMMIT_MSG"
        git push

        echo "✓ Changes pushed to academic-template"
```

4. Push changes to xanthan's `main`
5. The workflow will automatically run and sync to the new template

## Customizing Sync per Template

If a template needs to exclude certain files, use `--exclude` flags:

```yaml
# Example: exclude sidebar.css from portfolio-template
rsync -av --delete --exclude='sidebar.css' \
  xanthan-source/assets/css/ portfolio-template/assets/css/

# Example: exclude docs/index.md from all templates (already implemented)
rsync -av --delete --exclude='index.md' \
  xanthan-source/docs/ template/docs/

# Example: exclude multiple files
rsync -av --delete --exclude='file1.css' --exclude='file2.js' \
  xanthan-source/assets/ minimal-template/assets/
```

## Troubleshooting

### Sync fails with "repository not found"
- Check that `SYNC_TOKEN` has access to the template repository
- Verify the repository name in the job matches exactly

### Changes not appearing in template
- Check the workflow run in the Actions tab
- Ensure `SYNC_TOKEN` has write permissions
- Look for error messages in the workflow logs

### Unintended changes synced to template
- The `--delete` flag removes files in templates that no longer exist in xanthan
- If this is unwanted, remove `--delete` from the rsync command (but risks stale files)
- Alternatively, use inclusion lists instead of deletion

## Best Practices

1. **Keep core and template-specific clearly separated** — Don't add custom CSS to `assets/css/base.css`; create a template-specific `assets/css/custom.css` instead
2. **Document template-specific settings** — Note in template README what's different (baseurl, nav structure, etc.)
3. **Test core changes** — Before pushing to main, verify changes don't break all templates
4. **Monitor sync runs** — Check Actions tab occasionally to ensure syncs are working

