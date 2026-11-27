// "Ask me" chat. Every answer comes from chat/answers.md, written by Yusuf; nothing is generated.
// A small Hugging Face model (all-MiniLM-L6-v2) runs in the visitor's browser and picks the closest
// question. Until it has loaded, or on slow connections, keyword matching picks instead.
// Two guided flows (a project, a job) end in a ready-written WhatsApp or e-mail message.
(() => {
  const ME = {
    phone: '918925788226',
    phoneShown: '+91 89257 88226',
    email: 'yusufyt287@gmail.com',
    cv: '/resume/Yusuf-Khan-CV.pdf',
    linkedin: 'https://www.linkedin.com/in/yusuf-khan-8a1bb4378/',
    github: 'https://github.com/Yusufi8',
    instagram: '', // add the profile URL to show Instagram buttons
  };
  const MODEL = 'Xenova/all-MiniLM-L6-v2';
  const LIB = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1';
  const MATCH = 0.5;      // below this, the chat admits it doesn't know
  const STORE = 'yk-chat';

  const wa = (text) => `https://wa.me/${ME.phone}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
  const mail = (subject, body) => `mailto:${ME.email}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ''}`;

  // ---------- Answers file ----------
  let entries = [];

  const parse = (md) => {
    const out = [];
    let cur = null;
    for (const raw of md.split('\n')) {
      const line = raw.trimEnd();
      if (line.startsWith('## ')) {
        cur = { q: line.slice(3).trim(), asked: [], next: [], buttons: [], body: [] };
        out.push(cur);
        continue;
      }
      if (!cur) continue;
      const meta = !cur.body.length && line.match(/^(asked|next|buttons):\s*(.*)$/i);
      if (meta) {
        const list = meta[2].split(meta[1].toLowerCase() === 'buttons' ? /[|,]/ : '|').map((s) => s.trim()).filter(Boolean);
        cur[meta[1].toLowerCase()].push(...list);
      } else if (line || cur.body.length) {
        cur.body.push(line);
      }
    }
    out.forEach((e) => { e.text = e.body.join('\n').trim(); });
    return out.filter((e) => e.text);
  };

  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const inline = (s) => esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:|tel:|\/|#)[^)\s]*)\)/g, (m, t, u) =>
      `<a href="${u}"${/^https?:/.test(u) ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`);

  // Paragraphs and "- " / "1. " lists
  const render = (text) => text.split(/\n{2,}/).map((block) => {
    const lines = block.split('\n');
    if (lines.every((l) => /^- /.test(l))) return `<ul>${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join('')}</ul>`;
    if (lines.every((l) => /^\d+\. /.test(l))) return `<ol>${lines.map((l) => `<li>${inline(l.replace(/^\d+\. /, ''))}</li>`).join('')}</ol>`;
    const head = lines.findIndex((l) => /^(- |\d+\. )/.test(l));
    if (head > 0) return `<p>${inline(lines.slice(0, head).join(' '))}</p>${render(lines.slice(head).join('\n'))}`;
    return `<p>${inline(lines.join(' '))}</p>`;
  }).join('');

  // ---------- Keyword matching (instant, works everywhere) ----------
  const STOP = new Set('a an the is are am was were be do does did i you your yours me my we our us he his him it its to of in on for with and or at by about can could would will should tell know what which who how where when why there this that any some please hi just also more have has had get got give want need like much many good great strong able well really very'.split(' '));
  const SAME = { resume: 'cv', biodata: 'cv', cost: 'price', rate: 'price', fee: 'price', fees: 'price', charge: 'price', quote: 'price', quotation: 'price', budget: 'price', salary: 'ctc', mobile: 'phone', number: 'phone', mail: 'email', e: 'email', location: 'based', city: 'based', live: 'based', job: 'role', vacancy: 'role', position: 'role', opening: 'role', hiring: 'role', freelancer: 'freelance', migrate: 'upgrade', migration: 'upgrade', dashboards: 'dashboard', reports: 'report', module: 'modules' };
  const stem = (w) => (w.length > 4 ? w.replace(/(ing|ed|s)$/, '').replace(/e$/, '') : w);
  const words = (s) => s.toLowerCase().replace(/[^a-z0-9.+#]+/g, ' ').split(' ')
    .map((w) => w.replace(/^\.+|\.+$/g, '')).filter((w) => w && !STOP.has(w)).map((w) => stem(SAME[w] || w));

  let idf = {};
  const index = () => {
    const df = {};
    entries.forEach((e) => {
      e.keys = new Set(words([e.q, ...e.asked].join(' ')));
      e.bodyKeys = new Set(words(e.text));
      new Set([...e.keys, ...e.bodyKeys]).forEach((w) => { df[w] = (df[w] || 0) + 1; });
    });
    idf = Object.fromEntries(Object.entries(df).map(([w, n]) => [w, Math.log(1 + entries.length / n)]));
  };

  const keywordScores = (q) => {
    const qw = [...new Set(words(q))];
    const total = qw.reduce((t, w) => t + (idf[w] || 1.5), 0);
    return entries.map((e) => {
      if (!total) return 0;
      // A phrase from "asked:" inside the question is a strong hit on its own
      const lower = ` ${q.toLowerCase().replace(/[^a-z0-9]+/g, ' ')} `;
      const phrase = e.asked.some((a) => a.length > 3 && lower.includes(` ${a.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `));
      const hit = qw.reduce((t, w) => t + (e.keys.has(w) ? (idf[w] || 1.5) : e.bodyKeys.has(w) ? 0.25 * (idf[w] || 1.5) : 0), 0);
      return Math.max(hit / total, phrase ? 0.75 : 0);
    });
  };

  // ---------- The Hugging Face model, in the browser ----------
  let embed = null;      // the feature-extraction pipeline once loaded
  let vectors = null;    // per entry: vectors of its question and each "asked" phrase
  let modelState = 'off';

  const slowConnection = () => {
    const c = navigator.connection;
    return !!(c && (c.saveData || /2g/.test(c.effectiveType || '')));
  };

  const loadModel = async () => {
    if (modelState !== 'off' || slowConnection()) return;
    setModelState('loading');
    try {
      const { pipeline, env } = await import(`${LIB}/dist/transformers.min.js`);
      env.allowLocalModels = false;
      embed = await pipeline('feature-extraction', MODEL, { dtype: 'q8' });
      const texts = entries.map((e) => [e.q, ...e.asked.filter((a) => a.split(' ').length > 1)]);
      const flat = texts.flat();
      const out = await embed(flat, { pooling: 'mean', normalize: true });
      const all = out.tolist();
      let i = 0;
      vectors = texts.map((t) => t.map(() => all[i++]));
      setModelState('on');
    } catch (err) {
      console.warn('Chat model not available, using keyword matching', err);
      embed = null;
      setModelState('failed');
    }
  };

  const dot = (a, b) => a.reduce((t, v, i) => t + v * b[i], 0);

  const best = async (q) => {
    const kw = keywordScores(q);
    let sem = null;
    if (embed && vectors) {
      try {
        const [v] = (await embed([q], { pooling: 'mean', normalize: true })).tolist();
        sem = vectors.map((list) => Math.max(...list.map((u) => dot(u, v))));
      } catch (e) { sem = null; }
    }
    const score = entries.map((_, i) => (sem ? Math.max(sem[i], 0.55 * sem[i] + 0.45 * kw[i]) : kw[i]));
    const order = score.map((s, i) => [s, i]).sort((a, b) => b[0] - a[0]);
    return { top: order[0], near: order.slice(0, 3).filter(([s]) => s > 0.3).map(([, i]) => entries[i].q) };
  };

  // ---------- UI ----------
  // Icons the chat uses, added to the page if its own icon sprite doesn't have them
  const ICONS = {
    whatsapp: '<path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.2 5 5 0 0 0 1.1 2.7 11.5 11.5 0 0 0 4.4 3.9c1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.3Z"/>',
    mail: '<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M3 5.5h18v13H3zM3.5 6l8.5 7 8.5-7"/>',
    phone: '<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M6.6 3.5h3l1.5 4-2 1.3a11 11 0 0 0 6.1 6.1l1.3-2 4 1.5v3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.6 5.5a2 2 0 0 1 2-2Z"/>',
    download: '<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14"/>',
    arrow: '<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M7 17 17 7M8 7h9v9"/>',
    send: '<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M4 12 20 4l-6 16-3-7-7-1Z"/>',
    linkedin: '<path fill="currentColor" d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z"/>',
    github: '<path fill="currentColor" d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z"/>',
    instagram: '<g fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/></g><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/>',
  };
  const sprite = () => {
    const missing = Object.keys(ICONS).filter((id) => !document.getElementById(`i-${id}`));
    if (!missing.length) return;
    const holder = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    holder.setAttribute('aria-hidden', 'true');
    holder.setAttribute('style', 'position:absolute;width:0;height:0');
    holder.innerHTML = missing.map((id) => `<symbol id="i-${id}" viewBox="0 0 24 24">${ICONS[id]}</symbol>`).join('');
    document.body.prepend(holder);
  };

  const icon = (id) => `<svg aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const BUTTONS = {
    whatsapp: () => ME.phone && `<a class="chat-act chat-wa" href="${wa('Hi Yusuf, I found you through your website.')}" target="_blank" rel="noopener">${icon('whatsapp')}WhatsApp</a>`,
    email: () => `<a class="chat-act" href="${mail('Hello from your website')}">${icon('mail')}E-mail</a>`,
    call: () => `<a class="chat-act" href="tel:+${ME.phone}">${icon('phone')}Call</a>`,
    cv: () => `<a class="chat-act" href="${ME.cv}" download>${icon('download')}Download CV</a>`,
    linkedin: () => `<a class="chat-act" href="${ME.linkedin}" target="_blank" rel="noopener">${icon('linkedin')}LinkedIn</a>`,
    github: () => `<a class="chat-act" href="${ME.github}" target="_blank" rel="noopener">${icon('github')}GitHub</a>`,
    instagram: () => ME.instagram && `<a class="chat-act" href="${ME.instagram}" target="_blank" rel="noopener">${icon('instagram')}Instagram</a>`,
    work: () => `<a class="chat-act" href="/#work">${icon('arrow')}See the work</a>`,
    project: () => `<button class="chat-act chat-act-strong" type="button" data-flow="project">Start a project</button>`,
    job: () => `<button class="chat-act chat-act-strong" type="button" data-flow="job">I'm hiring</button>`,
  };
  const buttons = (names) => {
    const html = names.map((n) => (BUTTONS[n.toLowerCase()] || (() => ''))()).filter(Boolean).join('');
    return html ? `<div class="chat-acts">${html}</div>` : '';
  };

  const START_CHIPS = ['Who is Yusuf?', 'What have you built?', 'Are you available for freelance projects?', 'Are you open to full-time jobs?'];

  let root, log, form, input, chipsEl, statusEl, launcher;
  let history = [];   // [{who, html}] kept for this browser tab
  let flow = null;    // the guided flow in progress

  const save = () => { try { sessionStorage.setItem(STORE, JSON.stringify(history.slice(-40))); } catch (e) {} };

  const add = (who, html, keep = true) => {
    const el = document.createElement('div');
    el.className = `chat-msg chat-${who}`;
    el.innerHTML = html;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    if (keep) { history.push({ who, html }); save(); }
    return el;
  };

  const setChips = (list) => {
    chipsEl.innerHTML = '';
    list.forEach((text) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chat-chip';
      b.textContent = text;
      b.addEventListener('click', () => ask(text));
      chipsEl.appendChild(b);
    });
  };

  const typing = () => add('bot', '<span class="chat-dots" aria-label="Typing"><i></i><i></i><i></i></span>', false);
  const pause = (ms) => new Promise((r) => setTimeout(r, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ms));

  const reply = async (html, chips = []) => {
    const t = typing();
    await pause(350 + Math.min(html.length, 600) / 2);
    t.remove();
    add('bot', html);
    setChips(chips);
  };

  // ---------- Guided flows ----------
  const FLOWS = {
    project: {
      steps: [
        { key: 'need', say: "Great, let's plan it. What do you need help with?",
          chips: ['A new custom module', 'Reports or documents', 'Workflow and approvals', 'A dashboard', 'Upgrade to a newer Odoo', 'Support and fixes', 'Something else'] },
        { key: 'about', say: 'Tell me a little about it: your business, your Odoo version, and what should happen. A sentence or two is enough.', chips: ['Skip'] },
        { key: 'who', say: "And who should I reply to? Your name, and company if you'd like.", chips: ['Skip'] },
      ],
      finish: (a) => {
        const lines = [`Hi Yusuf, I found you through your website.`, `I need help with: ${a.need}.`];
        if (a.about) lines.push(`About the project: ${a.about}`);
        if (a.who) lines.push(`I'm ${a.who}.`);
        lines.push('Could you share a quote and timeline?');
        return { text: lines.join('\n'), subject: `Odoo project: ${a.need}`,
          say: "Thanks! Here's your message, ready to send. I'll reply with any questions, then a **quote and timeline**. Rates are flexible." };
      },
    },
    job: {
      steps: [
        { key: 'role', say: "Great to hear! Which role is it, and at which company? (For example: Odoo Developer at ABC, Dubai.)", chips: ['Skip'] },
        { key: 'who', say: "And your name, so I know who I'm talking to?", chips: ['Skip'] },
      ],
      finish: (a) => {
        const lines = ['Hi Yusuf, I saw your website.'];
        lines.push(a.role ? `We're hiring: ${a.role}.` : "We're hiring and would like to talk to you.");
        if (a.who) lines.push(`I'm ${a.who}.`);
        return { text: lines.join('\n'), subject: a.role ? `Role: ${a.role}` : 'A job opportunity',
          say: "Thanks! Here's your message, ready to send. You can also download my CV." };
      },
    },
  };

  const startFlow = async (name) => {
    flow = { name, step: 0, answers: {} };
    add('me', esc(name === 'project' ? 'I have a project for you' : "I'm hiring"));
    const s = FLOWS[name].steps[0];
    await reply(`<p>${esc(s.say)}</p>`, [...s.chips, 'Cancel']);
    input.placeholder = 'Type your answer…';
  };

  const flowAnswer = async (text) => {
    const f = FLOWS[flow.name];
    if (/^cancel$/i.test(text)) {
      flow = null;
      input.placeholder = 'Ask about my work…';
      return reply('<p>No problem. What else would you like to know?</p>', START_CHIPS);
    }
    const step = f.steps[flow.step];
    flow.answers[step.key] = /^skip$/i.test(text) ? '' : text.slice(0, 600);
    flow.step += 1;
    if (flow.step < f.steps.length) {
      const s = f.steps[flow.step];
      return reply(`<p>${esc(s.say)}</p>`, [...s.chips, 'Cancel']);
    }
    const done = f.finish(flow.answers);
    const extra = flow.name === 'job' ? BUTTONS.cv() : BUTTONS.call();
    flow = null;
    input.placeholder = 'Ask about my work…';
    await reply(`${render(done.say)}<blockquote class="chat-draft">${esc(done.text).replace(/\n/g, '<br>')}</blockquote>
      <div class="chat-acts">
        <a class="chat-act chat-wa" href="${wa(done.text)}" target="_blank" rel="noopener">${icon('whatsapp')}Send on WhatsApp</a>
        <a class="chat-act" href="${mail(done.subject, done.text)}">${icon('mail')}Send by e-mail</a>
        ${extra}
      </div>`, ['What have you built?', 'How do you work on a project?']);
  };

  // ---------- Asking ----------
  const answer = async (q) => {
    const { top: [score, i], near } = await best(q);
    if (score >= MATCH) {
      const e = entries[i];
      return reply(render(e.text) + buttons(e.buttons), e.next.length ? e.next : START_CHIPS);
    }
    const msg = `Hi Yusuf, I have a question from your website: ${q}`;
    return reply(`<p>I don't have an answer for that one yet, so ask me directly and I'll reply myself.</p>
      <div class="chat-acts">
        <a class="chat-act chat-wa" href="${wa(msg)}" target="_blank" rel="noopener">${icon('whatsapp')}Ask on WhatsApp</a>
        <a class="chat-act" href="${mail('A question from your website', msg)}">${icon('mail')}E-mail</a>
      </div>${near.length ? '<p class="chat-near">Or maybe one of these:</p>' : ''}`, near.length ? near : START_CHIPS);
  };

  const ask = async (text) => {
    text = text.trim().slice(0, 300);
    if (!text) return;
    open();
    setChips([]);
    if (flow) { add('me', esc(text)); return flowAnswer(text); }
    if (/^i have a project for you$/i.test(text)) return startFlow('project');
    if (/^i'?m hiring$/i.test(text)) return startFlow('job');
    add('me', esc(text));
    if (!entries.length) await ready;
    return answer(text);
  };

  const setModelState = (s) => {
    modelState = s;
    if (!statusEl) return;
    statusEl.dataset.state = s;
    statusEl.textContent = {
      loading: 'Loading the AI model…',
      on: 'AI model ready · runs in your browser',
      failed: 'Answers written by Yusuf',
      off: 'Answers written by Yusuf',
    }[s];
  };

  // ---------- Panel ----------
  const build = () => {
    launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.className = 'chat-launcher';
    launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-controls', 'chat-panel');
    launcher.innerHTML = `<span class="chat-launcher-face"><img src="/images/profile.webp" alt="" width="40" height="40"></span><span class="chat-launcher-text">Ask me anything</span>`;

    root = document.createElement('section');
    root.id = 'chat-panel';
    root.className = 'chat';
    root.hidden = true;
    root.setAttribute('aria-label', 'Chat with Yusuf');
    root.innerHTML = `
      <header class="chat-head">
        <img src="/images/profile.webp" alt="" width="40" height="40">
        <div><strong>Yusuf Khan</strong><span class="chat-status" data-state="off">Answers written by Yusuf</span></div>
        <button type="button" class="chat-reset" aria-label="Start over" title="Start over">↺</button>
        <button type="button" class="chat-close" aria-label="Close chat">×</button>
      </header>
      <div class="chat-log" role="log" aria-live="polite"></div>
      <div class="chat-chips"></div>
      <form class="chat-form">
        <label class="sr-only" for="chat-input">Your question</label>
        <input id="chat-input" name="q" autocomplete="off" maxlength="300" placeholder="Ask about my work…">
        <button type="submit" aria-label="Send">${icon('send')}</button>
      </form>
      <nav class="chat-foot" aria-label="Contact Yusuf">
        <a href="${wa('Hi Yusuf, I found you through your website.')}" target="_blank" rel="noopener">${icon('whatsapp')}WhatsApp</a>
        <a href="${mail('Hello from your website')}">${icon('mail')}E-mail</a>
        <a href="tel:+${ME.phone}">${icon('phone')}${ME.phoneShown}</a>
      </nav>`;
    document.body.append(root, launcher);

    log = root.querySelector('.chat-log');
    form = root.querySelector('.chat-form');
    input = root.querySelector('#chat-input');
    chipsEl = root.querySelector('.chat-chips');
    statusEl = root.querySelector('.chat-status');
    setModelState(modelState);

    launcher.addEventListener('click', () => (root.hidden ? open() : close()));
    root.querySelector('.chat-close').addEventListener('click', close);
    root.querySelector('.chat-reset').addEventListener('click', reset);
    form.addEventListener('submit', (e) => { e.preventDefault(); const t = input.value; input.value = ''; ask(t); });
    root.addEventListener('keydown', (e) => { if (e.key === 'Escape') { close(); launcher.focus(); } });
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-flow]');
      if (b && !flow) startFlow(b.dataset.flow);
    });

    try { history = JSON.parse(sessionStorage.getItem(STORE)) || []; } catch (e) { history = []; }
    if (history.length) {
      history.forEach((m) => add(m.who, m.html, false));
      setChips(START_CHIPS);
    }
  };

  const greet = () => {
    add('bot', `<p>Hi, I'm Yusuf, an Odoo developer from Chennai. 👋</p><p>Ask me anything about my work, or tell me about your project. Everything here is written by me, and you can reach me directly on WhatsApp, e-mail or phone.</p>`);
    setChips(START_CHIPS);
  };

  const reset = () => {
    history = []; flow = null; save();
    log.innerHTML = '';
    input.placeholder = 'Ask about my work…';
    greet();
    input.focus();
  };

  function open() {
    if (!root.hidden) return;
    root.hidden = false;
    document.documentElement.classList.add('chat-open');
    launcher.setAttribute('aria-expanded', 'true');
    if (!log.children.length) greet();
    loadModel();
    if (!matchMedia('(pointer: coarse)').matches) input.focus();
  }

  function close() {
    root.hidden = true;
    document.documentElement.classList.remove('chat-open');
    launcher.setAttribute('aria-expanded', 'false');
  }

  // Load the answers, then build the panel
  const base = new URL('.', document.currentScript.src);
  const ready = fetch(new URL('answers.md', base), { cache: 'no-cache' })
    .then((r) => (r.ok ? r.text() : Promise.reject(r.status)))
    .then((md) => { entries = parse(md); index(); })
    .catch((err) => { console.warn('Chat answers not loaded', err); });

  sprite();
  build();

  // Any element on the page can open the chat: data-chat (just open), data-chat="question", data-chat-flow="project|job"
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-chat], [data-chat-flow]');
    if (!t || root.contains(t)) return;
    e.preventDefault();
    if (t.dataset.chatFlow) { open(); if (!flow) startFlow(t.dataset.chatFlow); return; }
    if (t.dataset.chat) ask(t.dataset.chat); else open();
  });

  window.ykChat = { open, ask, close };
})();
