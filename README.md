# Yusuf Khan · Portfolio

Personal site of Yusuf Khan, Odoo Developer and ERP Technical Consultant at T&I Global, Coimbatore.
Live at **https://iyusufkhan.netlify.app**.

A static site with no build step.

```
index.html                 Home: hero, featured work, experience, skills, about, contact
work/<project>/index.html  One case-study page per featured project
404.html                   Not-found page (Netlify serves it automatically)
style.css                  Design tokens (light/dark) and all components
script.js                  Theme toggle, mobile menu, scroll highlights, reveal, workflow animation, copy email
images/                    Profile photo (WebP + JPEG), favicon, 1200×630 share image
resume/                    Downloadable CVs (International and India versions)
robots.txt, sitemap.xml    Search engine files; add new pages to the sitemap
netlify.toml               Publish settings and response headers
```

## Run locally

```bash
python3 -m http.server 4321
```

Then open http://127.0.0.1:4321. Pages use root-relative paths (`/style.css`), so open them through a server rather than as files.

## Editing

- Home-page projects are `<article class="case">` blocks in `index.html`; each links to its case study.
- Each case study has the same sections: problem, solution, contribution, workflow, architecture, technologies, testing, status.
  The architecture diagram is plain HTML (`.arch` layers), so it reflows on phones.
- Status pills: `pill-live` (in production), `pill-build` (in development), `pill-done` (completed), `pill-own` (independent).
- Skill tags: solid = professional work, `tag-proj` (dashed) = in-development or independent projects, `tag-learn` = learning.
- Colours and fonts are CSS variables at the top of `style.css`; light-theme colours are chosen to meet WCAG AA contrast.
- To update a CV, replace the PDF in `resume/` and keep the file name.

## Deploy

Netlify publishes the repository root (see `netlify.toml`). Pushing to `main` redeploys the live site.
