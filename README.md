# Yusuf Khan · Portfolio

Personal site of Yusuf Khan, Odoo Developer and ERP Techno-Functional Consultant at T&I Projects Private Limited, Coimbatore.
Live at **https://iyusufkhan.netlify.app**.

A static site with no build step.

```
index.html                 Home: hero, featured work, experience, skills, about, contact
work/<project>/index.html  One case-study page per featured project
404.html                   Not-found page (Netlify serves it automatically)
style.css                  Design tokens (light/dark) and all components
script.js                  Theme toggle, mobile menu, scroll highlights, reveal, workflow animation, copy email
images/                    Profile photo, favicon, share image; images/work/ holds sanitized project screenshots
resume/                    Downloadable CV (Yusuf-Khan-CV.pdf)
robots.txt, sitemap.xml    Search engine files; add new pages to the sitemap
netlify.toml               Publish settings and response headers
```

## Run locally

```bash
python3 -m http.server 4321
```

Then open http://127.0.0.1:4321. Pages use root-relative paths (`/style.css`), so open them through a server rather than as files.

## The chat

`chat/answers.md` holds every answer the chat can give, written in my own words: one `## question` per answer,
with other ways of asking it (`asked:`), follow-up buttons (`next:`) and contact buttons (`buttons:`). Instructions
are at the top of the file. Edit it, push, and the site has the new answers within a minute or two.

`chat/chat.js` runs a small Hugging Face model (all-MiniLM-L6-v2, about 25 MB, cached after the first visit) in the
visitor's browser to find the closest question. It doesn't write text of its own, needs no API key and costs nothing. On
slow connections it uses keyword matching instead. Unanswered questions, "I have a project" and "I'm hiring" end in a
ready-written WhatsApp or e-mail message. Contact details and the Instagram link are at the top of `chat/chat.js`.

## Editing

- The problem picker ("What's slowing your business down?") and "How I work" are tab panels in `index.html`.
  Any button with `data-chat="question"` opens the chat with that question, and `data-chat-flow="project"` or `"job"` starts a flow.
- Home-page projects are `<article class="case">` blocks in `index.html`; each links to its case study.
- Each case study has the same sections: problem, solution, contribution, workflow, architecture, technologies, testing, status.
  The architecture diagram is plain HTML (`.arch` layers), so it reflows on phones.
- Colours and fonts are CSS variables at the top of `style.css`; light-theme colours are chosen to meet WCAG AA contrast.
- To update a CV, replace the PDF in `resume/` and keep the file name.

## Deploy

Netlify publishes the repository root (see `netlify.toml`). Pushing to `main` redeploys the live site.
