# Deploying to Cloudflare Pages

1. **Commit & Push** your changes to your Git provider (GitHub/GitLab).
2. **Log in** to your [Cloudflare Dashboard](https://dash.cloudflare.com).
3. Go to **Pages** > **Create a project** > **Connect to Git**.
4. Select your `SpritePacker` repository.
5. Configure the build settings:
    - **Framework Preset**: `Vite` (or `React`, but `Vite` is preferred)
    - **Build command**: `npm run build`
    - **Build output directory**: `dist`
6. Click **Save and Deploy**.

## Troubleshooting
If you created a **Cloudflare Worker** project instead of a **Page** (which uses `npx wrangler deploy`), ensure the `wrangler.jsonc` file is present in your repo.
- This file tells Cloudflare to serve the `./dist` folder as static assets.
- If you see `[ERROR] Missing entry-point`, committing `wrangler.jsonc` will fix it.

**Notes:**
- The current build is a Client-Side Single Page Application (SPA).
- No special strict routing is needed yet, but if you add routing later, you might need a `_redirects` file (e.g., `/* /index.html 200`).
- The project is configured to output to the `dist` folder.
