# Xanthan Demo Scripts

Automated Puppeteer scripts for recording tutorial videos demonstrating GitHub workflows.

## What This Does

The `github-workflow-demo.js` script automates all the steps from your Getting Started guide:

1. ✅ Logs into GitHub
2. ✅ Uses the Xanthan template repository
3. ✅ Creates a new repository
4. ✅ Edits `_config.yml` to update baseurl
5. ✅ Enables GitHub Pages
6. ✅ Edits the homepage (index.md)
7. ✅ Edits navigation (_data/top-nav.yml)
8. ✅ Shows the build status in Actions

All with realistic timing and pacing perfect for screen recording.

## Setup

### 1. Install Dependencies

```bash
cd demo-scripts
npm install
```

### 2. Set GitHub Credentials

You need to provide your GitHub credentials as environment variables:

```bash
export GITHUB_USERNAME="your-github-username"
export GITHUB_PASSWORD="your-github-password"
```

**For macOS/Linux**, add these to your `~/.zshrc` or `~/.bashrc`:
```bash
echo 'export GITHUB_USERNAME="your-username"' >> ~/.zshrc
echo 'export GITHUB_PASSWORD="your-password"' >> ~/.zshrc
source ~/.zshrc
```

**Security Note**: If you have 2FA enabled (recommended), you may need to:
- Use a Personal Access Token instead of your password
- Or manually enter the 2FA code when prompted (script pauses for 30 seconds)

### 3. Configure the Script (Optional)

Edit `github-workflow-demo.js` to customize:

```javascript
const CONFIG = {
  DEMO_SPEED: 2.0,        // How slow to run (2.0 = twice as slow)
  NEW_REPO_NAME: 'my-demo-site',  // Base name for test repo
  HEADLESS: false,        // false = you can see the browser
  SLOW_MO: 100,          // Milliseconds between actions
  // ... more options
};
```

## Usage

### Record the Full Workflow

1. **Start your screen recorder** (OBS, Loom, QuickTime, etc.)
2. **Run the script:**
   ```bash
   npm run demo
   ```
3. **Watch it go!** The browser will open and automatically go through all the steps
4. **Stop recording** when done

### Tips for Recording

**Adjust Speed**:
- `DEMO_SPEED: 1.0` = normal speed
- `DEMO_SPEED: 2.0` = half speed (good for tutorials)
- `DEMO_SPEED: 0.5` = double speed (for quick demos)

**Window Size**:
- Default is 1280x800 (good for most recordings)
- Edit `VIEWPORT` in CONFIG to change

**Zoom Level**:
- After the script starts, you can press Cmd/Ctrl + to zoom the browser
- Makes text more readable in recordings

**Hide Distractions**:
- Close other windows
- Use Do Not Disturb mode
- Hide desktop icons if needed

## What Gets Created

Each run creates a new repository with a timestamp:
- Repository: `my-demo-site-2025-12-30`
- Website: `https://YOUR_USERNAME.github.io/my-demo-site-2025-12-30/`

This means you can:
- Run it multiple times without conflicts
- Keep successful demos as live examples
- Delete failed attempts and try again

## Cleanup

After recording, you can delete test repositories:

```bash
# Delete via GitHub web interface:
# Settings → Danger Zone → Delete this repository

# Or use GitHub CLI:
gh repo delete YOUR_USERNAME/my-demo-site-2025-12-30
```

## Troubleshooting

### "Credentials not found"
Make sure you exported the environment variables in the same terminal where you run the script.

### Script hangs at 2FA
The script pauses for 30 seconds for you to manually enter your 2FA code. If you need more time, increase the wait in the script.

### Clicks missing elements
GitHub's UI changes sometimes. Check the selectors in the script and update if needed.

### Recording is too fast
Increase `DEMO_SPEED` to 3.0 or 4.0 for slower pacing.

### Recording is too slow
Decrease `DEMO_SPEED` to 1.0 or lower.

## Adding AI Narration Later

Once you have the screen recording:

1. **Write a script** describing what's happening at each step
2. **Generate AI voice** using:
   - ElevenLabs (realistic voices)
   - Google Cloud Text-to-Speech (free tier available)
   - Amazon Polly
3. **Combine in video editor**:
   - iMovie (Mac, free)
   - DaVinci Resolve (cross-platform, free)
   - Kapwing (online, freemium)

## Extending the Script

Want to demo other workflows? Common additions:

### Add Image Upload Demo
```javascript
// After editing homepage
console.log('📸 Step: Uploading an image...');
await clickAndWait(page, 'a[title="assets"]', 2000);
// ... continue with upload workflow
```

### Demo Creating a New Page
```javascript
console.log('📄 Step: Creating a new page...');
await clickAndWait(page, 'button:has-text("Add file")', 1000);
await clickAndWait(page, 'a:has-text("Create new file")', 2000);
// ... continue
```

See the main script for patterns to follow.

## Credits

Built for the Xanthan project - helping students and faculty create sustainable digital scholarship.
