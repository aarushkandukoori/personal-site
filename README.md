# aarushkandukoori.com

Personal site for [Aarush Kandukoori](https://aarushkandukoori.com), built with the [Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy) Jekyll theme (Starter template) and a strict black-and-white restyle.

## Setup path

This repo uses **[cotes2020/chirpy-starter](https://github.com/cotes2020/chirpy-starter)** with the `jekyll-theme-chirpy` gem, not a theme fork. Monochrome styling lives in `assets/css/jekyll-theme-chirpy.scss` as CSS variable and syntax-highlight overrides. That keeps theme upgrades manageable: merge upstream starter tags, run `bundle update`, and re-check the override file if variables change.

## Local development

**Requirements:** Ruby 3.1+, Bundler 2.x

```bash
bundle install
bundle exec jekyll s
```

Open `http://127.0.0.1:4000`.

## Deploy to GitHub Pages

Chirpy does **not** build with GitHub Pages' default "Deploy from a branch" Jekyll builder. This repo includes `.github/workflows/pages-deploy.yml`.

1. Push this repo to GitHub (user/org site or project site).
2. In the repo: **Settings → Pages → Build and deployment → Source:** set to **GitHub Actions** (not "Deploy from a branch").
3. Push to `main`. The **Build and Deploy** workflow builds with `bundle exec jekyll b` and publishes `_site`.
4. **Custom domain:** `CNAME` is set to `aarushkandukoori.com`. In **Settings → Pages → Custom domain**, enter the same apex domain and configure DNS per [GitHub's custom domain docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

## Edit content

| What | Where |
|------|-------|
| Site title, URL, avatar | `_config.yml` |
| Sidebar contact icons | `_data/contact.yml` |
| About page | `_tabs/about.md` |
| Work / projects hub | `_tabs/work.md` |
| Blog posts | `_posts/` |
| Monochrome theme | `assets/css/jekyll-theme-chirpy.scss` |
| Avatar image | Replace `assets/img/avatar.svg` (or set `avatar:` in `_config.yml`) |

### Add a blog post

Create `_posts/YYYY-MM-DD-slug.md` with front matter:

```yaml
---
title: "Post title"
date: 2025-06-01 09:00:00 -0400
categories: [category-one, category-two]
tags: [tag-one, tag-two]
---
```

- **categories:** broad topics (shown on `/categories/`).
- **tags:** finer labels (shown on `/tags/`).
- Filename date must match or precede the `date` field.
- Two starter posts are marked `[DRAFT - replace with real content]`; swap in real write-ups when ready.

### Tabs

Sidebar tabs are Markdown files in `_tabs/`. Set `order:` (lower = higher) and optional `icon:` (Font Awesome class).

## Placeholders to fill in

- **Avatar:** `assets/img/avatar.svg` is a grayscale placeholder. Add your photo and update `avatar:` in `_config.yml`.
- **CV link:** About page lists `[PLACEHOLDER: add CV URL]`.
- **USPTO provisional:** Listed as `[VERIFY: #63/686,176]` until you confirm the number in USPTO records.
- **arXiv (music project):** The linked preprint [2408.06689](https://arxiv.org/abs/2408.06689) is the MoCo Innovation education study, not the music-to-image paper. Confirm any additional arXiv ID before linking the music work publicly.

## Theme upgrades

```bash
git remote add chirpy https://github.com/cotes2020/chirpy-starter.git
git fetch chirpy --tags
git merge vX.Y.Z --squash --allow-unrelated-histories
bundle update
```

Resolve conflicts, then re-test the monochrome overrides in `assets/css/jekyll-theme-chirpy.scss`.

## License

Site content: yours. Chirpy theme: MIT (see [theme license](https://github.com/cotes2020/jekyll-theme-chirpy/blob/master/LICENSE)).
