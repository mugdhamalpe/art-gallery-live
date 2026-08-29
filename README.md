# The Gallery — setup guide

A mobile-friendly painting gallery that lives on **GitHub Pages** (free, no database),
with an **admin login + upload screen** at `/admin` so you can hang new paintings
without touching code after setup.

## How it works (no database needed)

- Your paintings' info (title, year, medium, etc.) lives in one file: `data/paintings.json`.
- Your images live in `images/paintings/`.
- The `/admin` page is [Decap CMS](https://decapcms.org) — a free, open-source tool.
  When you log in with GitHub and hit "Publish," it commits the new image + JSON
  entry straight to your repo. GitHub Pages then just re-serves the updated site.
- There's no database because there doesn't need to be one — your repo *is* the database.

The only reason a "server" is needed at all is that logging in with GitHub requires
a private secret that can't live in a public repo. That's the one small piece
(a free Cloudflare Worker) described in Step 3.

---

## Preview locally before deploying anything

You can see the exact gallery UI, and even test uploading paintings, entirely on
your own machine — no GitHub repo, no OAuth, no Cloudflare needed yet.

1. Unzip the project and open a terminal in the `gallery/` folder.
2. Start the site itself:
   ```
   python3 -m http.server 8080
   ```
   Then open **http://localhost:8080** — this is your public gallery page.
3. In a **second terminal**, from the same `gallery/` folder, start the local
   admin backend:
   ```
   npx decap-server
   ```
   (First run will ask to install `decap-server` — say yes. Needs Node.js installed.)
4. Open **http://localhost:8080/admin/** — you'll land straight in the upload
   screen with no login prompt, because `local_backend: true` in `admin/config.yml`
   makes it write directly to your local files instead of GitHub.
5. Try adding, editing, or deleting a painting from there and refresh the main
   page — you'll see it update immediately. Any image you upload lands in
   `images/paintings/` and any edits land in `data/paintings.json`, right there
   on your disk, so you can inspect exactly what will get committed later.

Once you're happy with how it looks and behaves, follow Steps 1–5 below to put
it on GitHub Pages with real login for anyone other than you on your machine.

## Step 1 — Create the repo and turn on GitHub Pages

1. Create a new GitHub repo (public or private both work), e.g. `my-art-gallery`.
2. Push all the files in this project to it.
3. In the repo, go to **Settings → Pages**, set **Source** to your `main` branch, root folder.
4. Your site will be live at `https://YOUR_USERNAME.github.io/my-art-gallery/`.

## Step 2 — Create a GitHub OAuth App

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Fill in:
   - **Homepage URL**: your Pages URL from Step 1
   - **Authorization callback URL**: `https://gallery-oauth.YOUR-SUBDOMAIN.workers.dev/callback`
     (you'll get this exact URL in Step 3 — come back and update it after)
3. Save it. Copy the **Client ID** and generate/copy a **Client Secret**.

## Step 3 — Deploy the free OAuth worker (Cloudflare)

This is the one small "server" — it just relays a login, it never sees your paintings.

1. Sign up free at [dash.cloudflare.com](https://dash.cloudflare.com) if you don't have an account.
2. Install Wrangler (Cloudflare's CLI): `npm install -g wrangler`
3. From the `oauth-worker/` folder: `wrangler login`, then `wrangler deploy`
4. Set your secrets:
   ```
   wrangler secret put GITHUB_CLIENT_ID
   wrangler secret put GITHUB_CLIENT_SECRET
   ```
5. Wrangler will print your worker's URL, e.g. `https://gallery-oauth.janedoe.workers.dev`.
   Go back to your GitHub OAuth App (Step 2) and make sure the callback URL matches
   `<that-worker-url>/callback` exactly.

## Step 4 — Point the admin panel at your repo

Open `admin/config.yml` and update two lines:

```yaml
backend:
  repo: YOUR_GITHUB_USERNAME/YOUR_REPO_NAME
  base_url: https://gallery-oauth.janedoe.workers.dev   # your worker URL, no /callback
```

Commit and push.

## Step 5 — Upload your first painting

1. Visit `https://YOUR_USERNAME.github.io/my-art-gallery/admin/`
2. Click **Login with GitHub**, authorize the app.
3. Click into **Gallery Wall**, add an entry to the **Paintings** list, upload an image,
   fill in the title/medium/etc., and hit **Publish**.
4. Give GitHub Pages a minute to rebuild, then refresh your site — the painting is live.

Delete the three placeholder entries in `data/paintings.json` the same way, or edit
them directly from `/admin`.

---

## Customizing the look

- Colors and fonts are all CSS variables at the top of `styles.css` — easy to retune.
- The catalog numbers under each painting come from the `catalogNumber` field —
  leave it blank and it'll auto-number.
- Everything is responsive down to small phones already, including the full-screen
  spotlight view when you tap a painting.

## If something doesn't fit

- **Prefer even less setup?** You can skip the OAuth worker entirely and just add
  paintings by editing `data/paintings.json` and dropping images into
  `images/paintings/` via GitHub's web UI or `git push`. No login screen, but zero
  extra services to manage.
- **Want more power later** (sold/available tags, categories, a contact/inquiry form
  that emails you, etc.)? That's a good point to move to a small real backend with
  a database — happy to help you build that version when you're ready.
