/**
 * Puppeteer script to demonstrate GitHub workflows for Xanthan tutorial
 *
 * This script automates the steps from your getting-started.md guide:
 * - Using a template repository
 * - Editing files in GitHub
 * - Configuring GitHub Pages
 * - Editing navigation
 *
 * SETUP:
 * 1. npm install puppeteer
 * 2. Set environment variables:
 *    export GITHUB_USERNAME="your-username"
 *    export GITHUB_PASSWORD="your-password"
 *    export GITHUB_TOTP_SECRET="your-2fa-secret" (if using 2FA)
 * 3. Run with: node github-workflow-demo.js
 *
 * RECORDING:
 * - Use OBS, Loom, or QuickTime to record your screen while this runs
 * - Script includes delays to make actions visible and easy to follow
 * - Adjust DEMO_SPEED below to control pacing (1.0 = normal, 2.0 = slower)
 */

const puppeteer = require('puppeteer');

// Configuration
const CONFIG = {
  // Speed multiplier for demo (2.0 = twice as slow, good for recording)
  DEMO_SPEED: 2.0,

  // Template repository to use
  TEMPLATE_REPO: 'xanthan-web/xanthan',

  // Name for the new repository (will add timestamp to make unique)
  NEW_REPO_NAME: 'my-demo-site',

  // GitHub credentials from environment
  GITHUB_USERNAME: process.env.GITHUB_USERNAME,
  GITHUB_PASSWORD: process.env.GITHUB_PASSWORD,

  // Browser window size (good for recording)
  VIEWPORT: {
    width: 1280,
    height: 800
  },

  // Whether to run headless (false = you can see the browser)
  HEADLESS: false,

  // Whether to slow down all actions (good for demos)
  SLOW_MO: 100, // milliseconds between actions
};

// Helper function to wait (adjusted by DEMO_SPEED)
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms * CONFIG.DEMO_SPEED));

// Helper to type text slowly (more natural for demos)
async function typeSlowly(page, selector, text) {
  await page.waitForSelector(selector);
  await page.click(selector);
  await wait(300);
  for (const char of text) {
    await page.keyboard.type(char);
    await wait(50 + Math.random() * 50); // Vary speed slightly
  }
}

// Helper to click and wait
async function clickAndWait(page, selector, waitTime = 1000) {
  await page.waitForSelector(selector);
  await page.click(selector);
  await wait(waitTime);
}

async function main() {
  console.log('🎬 Starting GitHub workflow demo...');

  // Validate credentials
  if (!CONFIG.GITHUB_USERNAME || !CONFIG.GITHUB_PASSWORD) {
    console.error('❌ Please set GITHUB_USERNAME and GITHUB_PASSWORD environment variables');
    process.exit(1);
  }

  // Add timestamp to repo name to make it unique
  const timestamp = new Date().toISOString().slice(0, 10);
  const repoName = `${CONFIG.NEW_REPO_NAME}-${timestamp}`;

  console.log(`📦 Will create repository: ${repoName}`);

  // Launch browser
  const browser = await puppeteer.launch({
    headless: CONFIG.HEADLESS,
    slowMo: CONFIG.SLOW_MO,
    defaultViewport: CONFIG.VIEWPORT,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  await page.setViewport(CONFIG.VIEWPORT);

  try {
    // ============================================================
    // STEP 1: Login to GitHub
    // ============================================================
    console.log('\n📝 Step 1: Logging into GitHub...');
    await page.goto('https://github.com/login');

    await typeSlowly(page, '#login_field', CONFIG.GITHUB_USERNAME);
    await wait(500);
    await typeSlowly(page, '#password', CONFIG.GITHUB_PASSWORD);
    await wait(500);
    await clickAndWait(page, 'input[type="submit"]', 3000);

    // Handle 2FA if present
    const url = page.url();
    if (url.includes('two-factor') || url.includes('sessions/two-factor')) {
      console.log('🔐 2FA detected - you may need to enter code manually');
      console.log('   Waiting 30 seconds for manual entry...');
      await wait(30000);
    }

    // ============================================================
    // STEP 2: Navigate to template repository
    // ============================================================
    console.log('\n📦 Step 2: Navigating to template repository...');
    await page.goto(`https://github.com/${CONFIG.TEMPLATE_REPO}`);
    await wait(2000);

    // Scroll to show the repo description
    await page.evaluate(() => window.scrollBy(0, 200));
    await wait(1500);

    // ============================================================
    // STEP 3: Use this template
    // ============================================================
    console.log('\n✨ Step 3: Creating new repository from template...');

    // Click "Use this template" button
    await clickAndWait(page, 'button[data-target="template-button.menu"]', 1000);

    // Click "Create a new repository"
    await clickAndWait(page, 'a[href*="/generate"]', 2000);

    // ============================================================
    // STEP 4: Configure new repository
    // ============================================================
    console.log('\n⚙️  Step 4: Configuring repository...');

    // Repository name
    await wait(1000);
    await typeSlowly(page, '#repository_name', repoName);
    await wait(1500);

    // Optional: Add description
    await typeSlowly(page, '#repository_description', 'My personal website built with Xanthan');
    await wait(1500);

    // Make sure it's public (should be default)
    await page.evaluate(() => {
      const publicRadio = document.querySelector('#repository_visibility_public');
      if (publicRadio && !publicRadio.checked) {
        publicRadio.click();
      }
    });
    await wait(1000);

    // Scroll down to show the create button
    await page.evaluate(() => window.scrollBy(0, 300));
    await wait(1000);

    // Click "Create repository from template"
    await clickAndWait(page, 'button[type="submit"]', 3000);

    console.log(`✅ Repository created: https://github.com/${CONFIG.GITHUB_USERNAME}/${repoName}`);

    // ============================================================
    // STEP 5: Edit _config.yml (if needed)
    // ============================================================
    console.log('\n📝 Step 5: Editing configuration file...');

    // Navigate to _config.yml
    await wait(2000);
    await clickAndWait(page, 'a[title="_config.yml"]', 2000);

    // Click edit button (pencil icon)
    await clickAndWait(page, 'button[aria-label="Edit file"]', 2000);

    // Find and modify the baseurl line
    await page.evaluate(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        const lines = textarea.value.split('\n');
        const baseurlIndex = lines.findIndex(line => line.startsWith('baseurl:'));
        if (baseurlIndex !== -1) {
          // Highlight the line we're changing
          textarea.focus();
          const linesBeforeTarget = lines.slice(0, baseurlIndex).join('\n');
          textarea.setSelectionRange(linesBeforeTarget.length, linesBeforeTarget.length + lines[baseurlIndex].length);
        }
      }
    });

    await wait(2000);

    // Replace the baseurl value
    await page.evaluate((newRepoName) => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.value = textarea.value.replace(/baseurl:.*/, `baseurl: /${newRepoName}/`);
        // Trigger change event
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, repoName);

    await wait(2000);

    // Scroll down to commit button
    await page.evaluate(() => window.scrollBy(0, 400));
    await wait(1000);

    // Click "Commit changes" button
    await clickAndWait(page, 'button[data-hotkey="Control+Enter"]', 2000);

    console.log('✅ Configuration updated');

    // ============================================================
    // STEP 6: Enable GitHub Pages
    // ============================================================
    console.log('\n🌐 Step 6: Enabling GitHub Pages...');

    // Go to Settings
    await clickAndWait(page, 'a[data-content="Settings"]', 2000);

    // Click Pages in sidebar
    await clickAndWait(page, 'a[href*="/settings/pages"]', 2000);

    // Select "Deploy from a branch" if not already selected
    await wait(1000);

    // Click the branch dropdown (currently shows "None")
    await page.evaluate(() => {
      const summaries = Array.from(document.querySelectorAll('summary'));
      const branchSummary = summaries.find(s => s.textContent.includes('None') || s.textContent.includes('Select branch'));
      if (branchSummary) branchSummary.click();
    });

    await wait(1000);

    // Select "main" branch
    await page.evaluate(() => {
      const options = Array.from(document.querySelectorAll('[role="menuitemradio"]'));
      const mainOption = options.find(o => o.textContent.includes('main'));
      if (mainOption) mainOption.click();
    });

    await wait(1000);

    // Click Save button
    await clickAndWait(page, 'button:has-text("Save")', 2000);

    console.log('✅ GitHub Pages enabled');
    console.log(`🌐 Site will be available at: https://${CONFIG.GITHUB_USERNAME}.github.io/${repoName}/`);

    // ============================================================
    // STEP 7: Edit a page (demonstrate editing workflow)
    // ============================================================
    console.log('\n✏️  Step 7: Editing homepage...');

    // Go to Code tab
    await clickAndWait(page, 'a[data-content="Code"]', 2000);

    // Click on index.md
    await clickAndWait(page, 'a[title="index.md"]', 2000);

    // Click edit button
    await clickAndWait(page, 'button[aria-label="Edit file"]', 2000);

    // Make a simple edit - change the title or add text
    await page.evaluate(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        // Add a welcome message after the front matter
        const lines = textarea.value.split('\n');
        const frontMatterEnd = lines.findIndex((line, idx) => idx > 0 && line === '---');
        if (frontMatterEnd !== -1) {
          lines.splice(frontMatterEnd + 1, 0, '\n**Welcome to my new site!** This is my first edit on GitHub.\n');
          textarea.value = lines.join('\n');
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    });

    await wait(3000);

    // Scroll to commit button
    await page.evaluate(() => window.scrollBy(0, 400));
    await wait(1000);

    // Commit the change
    await clickAndWait(page, 'button[data-hotkey="Control+Enter"]', 2000);

    console.log('✅ Homepage edited');

    // ============================================================
    // STEP 8: Edit navigation (demonstrate _data editing)
    // ============================================================
    console.log('\n🧭 Step 8: Editing navigation menu...');

    // Navigate to _data folder
    await clickAndWait(page, 'a[title="_data"]', 2000);

    // Click on top-nav.yml
    await clickAndWait(page, 'a[title="top-nav.yml"]', 2000);

    // Click edit
    await clickAndWait(page, 'button[aria-label="Edit file"]', 2000);

    // Add a new nav item
    await page.evaluate(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        // Add a new nav item at the end
        textarea.value += '\n- title: "Contact"\n  url: "/contact"\n';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    await wait(3000);

    // Scroll to commit
    await page.evaluate(() => window.scrollBy(0, 400));
    await wait(1000);

    // Commit
    await clickAndWait(page, 'button[data-hotkey="Control+Enter"]', 2000);

    console.log('✅ Navigation updated');

    // ============================================================
    // STEP 9: Check Actions (build status)
    // ============================================================
    console.log('\n⚡ Step 9: Checking build status...');

    // Go to Actions tab
    await clickAndWait(page, 'a[data-content="Actions"]', 2000);

    // Show the most recent workflow run
    await wait(3000);

    console.log('✅ Build is running (or completed)');

    // ============================================================
    // DONE
    // ============================================================
    console.log('\n✨ Demo complete!');
    console.log(`\n📋 Summary:`);
    console.log(`   Repository: https://github.com/${CONFIG.GITHUB_USERNAME}/${repoName}`);
    console.log(`   Website: https://${CONFIG.GITHUB_USERNAME}.github.io/${repoName}/`);
    console.log(`   (Website will be live in 1-2 minutes)\n`);

    // Keep browser open for a bit to show final state
    await wait(5000);

  } catch (error) {
    console.error('❌ Error during demo:', error);
    // Take screenshot for debugging
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log('Screenshot saved to error-screenshot.png');
  } finally {
    console.log('\n🎬 Closing browser...');
    await wait(2000);
    await browser.close();
  }
}

// Run the script
main().catch(console.error);
