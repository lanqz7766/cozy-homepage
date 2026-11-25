# Deployment / 部署

This is a static site. Model generation is optional: the ready-to-use GLB and poster are checked in. You can deploy without installing Three.js locally.

## GitHub Pages

The public demo uses a `gh-pages` branch containing only the built `dist/` files. The source stays on `main`. This does not need a custom Actions workflow or the OAuth `workflow` scope.

1. Create a repository from this template and run `npm run check` and `npm run build`.
2. Publish the contents of `dist/` to a branch named `gh-pages` (include `.nojekyll`).
3. In **Settings → Pages**, select **Deploy from a branch**, `gh-pages`, and `/ (root)`.
4. Wait for GitHub's Pages deployment to finish, then visit the displayed URL.

For updates, keep a separate checkout of `gh-pages`, replace its site files with the new `dist/` contents, commit, and push. Do not copy `node_modules`, local files or the source repository's `.git` directory.

中文：源码保留在 main，构建后的 dist 内容发布到 gh-pages 分支。Settings → Pages 选择从分支部署，分支 gh-pages，目录根目录。以后更新需要重新构建并推送发布分支。

### Optional automatic deployment / 可选自动部署

Copy [`github-pages-workflow.yml`](github-pages-workflow.yml) to `.github/workflows/pages.yml` and select **GitHub Actions** in Pages settings. It checks and builds `dist/` on pushes to `main`. Creating that workflow through an OAuth token requires GitHub's `workflow` permission; the branch-based route above does not.

All asset links are relative, so root and repository-subpath hosting both work. For custom domains, configure your own domain in Pages settings; do not copy the original author's domain.

Reference: [GitHub's custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Other static hosts

```sh
npm run check
npm run build
```

Upload the **contents of `dist/`**, including assets, src, data, and license notices. On hosts with build configuration, set the command to `npm run build` and the output directory to `dist`; use Node 20+. No SPA rewrite is needed. For a manual Netlify deployment, drag `dist/` into its static deployment UI.

中文：其他平台部署时使用 `npm run build`，产物目录为 `dist`。手工上传整个 dist 的内容，不要只上传 index.html。

## Network behavior

The site requests pinned Three.js 0.169.0 modules from jsDelivr at runtime. Hosting does not require a backend or API key. If that CDN is unavailable, the static poster remains visible. To make the viewer fully self-hosted, vendor the exact Three.js module graph and update the three dynamic import URLs; retain its MIT notice. No analytics or original visitor-map service is shipped.

## Verify

Check the actual deployed URL: profile text, model loading, local images, section links, mobile width, and the publication dialog. A successful upload alone does not verify the rendered page.
