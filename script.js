document.documentElement.classList.add('js');

const root = document.documentElement;

// Theme toggle: follows the system until the visitor picks one
const themeBtn = document.getElementById('theme-toggle');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
const currentTheme = () => root.dataset.theme || (systemDark.matches ? 'dark' : 'light');

themeBtn.addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch (e) {}
});

// Mobile menu
const menuBtn = document.getElementById('menu-btn');
const navLinks = document.getElementById('nav-links');

const setMenu = (open) => {
  navLinks.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
};

menuBtn.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
navLinks.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
document.addEventListener('click', (e) => {
  if (!navLinks.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false);
});

// Nav border once the page scrolls
const nav = document.querySelector('.nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Highlight the nav link for the section in view (home page only)
const links = [...navLinks.querySelectorAll('a[href^="#"]')];
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main section[id]').forEach((s) => sectionObserver.observe(s));

// Case-study pages: highlight the table-of-contents entry for the section in view
const tocLinks = [...document.querySelectorAll('.cs-toc a')];
if (tocLinks.length) {
  const tocObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      tocLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  document.querySelectorAll('.cs-section[id]').forEach((s) => tocObserver.observe(s));
}

// Fade cards in as they scroll into view
const revealObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('in');
    obs.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

document.getElementById('year').textContent = new Date().getFullYear();

const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Tabs: the problem picker and the "How I work" steps. Arrow keys move between tabs.
document.querySelectorAll('[data-tabs]').forEach((box) => {
  const tabs = [...box.querySelectorAll('[role="tab"]')];
  const bar = box.querySelector('.process-bar i');
  let timer = null;

  const select = (tab, focus) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (bar) bar.style.width = `${((tabs.indexOf(tab) + 1) / tabs.length) * 100}%`;
    if (focus) tab.focus();
  };
  const stop = () => { clearInterval(timer); timer = null; };

  tabs.forEach((t, i) => {
    t.type = 'button';
    t.addEventListener('click', () => { stop(); select(t); });
    t.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (step) { e.preventDefault(); stop(); select(tabs[(i + step + tabs.length) % tabs.length], true); }
      if (e.key === 'Home') { e.preventDefault(); stop(); select(tabs[0], true); }
      if (e.key === 'End') { e.preventDefault(); stop(); select(tabs[tabs.length - 1], true); }
    });
  });
  select(tabs.find((t) => t.getAttribute('aria-selected') === 'true') || tabs[0]);

  // "How I work" steps through by itself while in view, until someone clicks a step
  if (box.hasAttribute('data-autoplay') && !calm) {
    const next = () => select(tabs[(tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true') + 1) % tabs.length]);
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !timer && !box.dataset.touched) timer = setInterval(next, 4200);
      if (!entry.isIntersecting) stop();
    }, { threshold: 0.5 }).observe(box);
    box.addEventListener('pointerdown', () => { box.dataset.touched = '1'; stop(); });
    box.addEventListener('focusin', () => { box.dataset.touched = '1'; stop(); });
  }
});
