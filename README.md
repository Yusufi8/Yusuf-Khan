# Yusuf Khan · Portfolio

Personal site of Yusuf Khan, Odoo 16 developer at T&I Global, Coimbatore.
Live at **https://iyusufkhan.netlify.app**.

A static site with no build step: `index.html`, `style.css`, `script.js` and `images/`.

## Run locally

```bash
python3 -m http.server 4321
```

Then open http://127.0.0.1:4321.

## What's on the page

- **Hero**: current role, location, and a small animation of the requisition workflow that's live in production
- **Selected work**: Material & Purchase Requisition, TIGL QC Platform, Product Intelligence System, Tally–Odoo Connector and JobPilot, plus smaller addons
- **Experience**: T&I Projects (2026–present) and Tidal Wave Infotech (2025–2026)
- **Skills, About, Education, Contact**

Light and dark themes follow the system setting, and a toggle saves the visitor's choice.
Animations are turned off for visitors who prefer reduced motion.

## Editing

- Content lives in `index.html`; each project is an `<article class="case">`.
- Colours and fonts are CSS variables at the top of `style.css`.
- The photo is served as `images/profile.webp`, with `profile.jpg` as the fallback (640×640).
  Export a new photo at that size to replace it.

## Deploy

Netlify serves the repository root. If the site is linked to this repository, pushing to `main` redeploys it; otherwise drag the folder into Netlify.
