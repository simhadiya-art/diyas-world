# Setup: VS Code, GitHub, Vercel and the contact form

Do these once. Each step says exactly what to click or type.

**Where the project lives:** `C:\Users\simha\Projects\diyas-world`
(Not in OneDrive on purpose. OneDrive breaks the thousands of small files in `node_modules`. GitHub is your backup instead.)

---

## 1. Open the project in VS Code

1. Open **VS Code** (already installed).
2. **File → Open Folder…** → choose `C:\Users\simha\Projects\diyas-world` → **Select Folder**. If asked "Do you trust the authors?", click **Yes**.
3. Open a terminal inside VS Code: **Terminal → New Terminal**.
4. Type `npm run dev` and press Enter. Open http://localhost:4321 in your browser. This is your private preview; it updates every time you save a file. Press `Ctrl + C` in the terminal to stop it.

Optional but nice: install the **Astro** extension (left sidebar → Extensions icon → search "Astro" → Install). It colors the code and catches typos.

---

## 2. Put the code on GitHub

GitHub stores your code online and is what Vercel publishes from.

1. Go to https://github.com/signup and create a free account (skip if you have one).
2. Click the **+** (top right) → **New repository**.
   - Repository name: `diyas-world`
   - Choose **Private** or **Public** (either works with Vercel; Private hides your code, not your site).
   - **Don't** tick "Add a README" or ".gitignore" (the project already has them).
   - Click **Create repository**.
3. Back in VS Code, click the **Source Control** icon in the left sidebar (the branching-lines icon).
   - Type a message like `First version of Diya's World` and click **Commit**. If it asks "stage all changes?", click **Yes**.
   - Click **Publish Branch** → choose **Publish to GitHub** → sign in to GitHub when the browser asks → pick the `diyas-world` repo you made (or let VS Code create it).

From now on: edit → Source Control → write a message → **Commit** → **Sync Changes**. That's it.

> Your originals in `assets-raw/` (including the big videos and PDFs) are deliberately **not** uploaded. They stay on your laptop. Keep a copy somewhere safe (OneDrive is perfect for that folder).

---

## 3. Put the site live on Vercel (free)

1. Go to https://vercel.com/signup → **Continue with GitHub**.
2. Click **Add New… → Project**, find `diyas-world`, click **Import**.
3. Vercel detects **Astro** automatically. Click **Deploy**.
4. About a minute later you get a live link like `diyas-world.vercel.app`. 🎉
5. Turn on analytics: in your project on Vercel, open the **Analytics** tab → **Enable**.

Every time you push to GitHub, Vercel rebuilds the site automatically.

If your Vercel URL is different from `diyas-world.vercel.app`, open `astro.config.mjs` and update the `site:` line so link previews point to the right place.

---

## 4. Connect the contact form (Web3Forms, free)

Until this is done, the Mailroom form opens the visitor's email app instead of sending directly.

1. Go to https://web3forms.com, enter `simhadiya@gmail.com`, click **Create Access Key**. They email you a key (a long code).
2. **For the live site:** Vercel → your project → **Settings → Environment Variables** → add
   - Key: `PUBLIC_WEB3FORMS_KEY`
   - Value: *(paste the key)*
   - Save, then go to **Deployments** → the latest one → **⋯ → Redeploy**.
3. **For your local preview (optional):** in VS Code, copy `.env.example`, rename the copy to `.env`, and paste the key after `PUBLIC_WEB3FORMS_KEY=`. (`.env` is never uploaded to GitHub.)

Send yourself a test message from the live Mailroom page to check it arrives.
