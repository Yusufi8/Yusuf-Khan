// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      const offsetTop = target.offsetTop - 80; // Account for fixed navbar
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
      
      // Close mobile menu if open
      const navMenu = document.querySelector('.nav-menu');
      const hamburger = document.querySelector('.hamburger');
      navMenu.classList.remove('active');
      hamburger.classList.remove('active');
    }
  });
});

// Mobile menu toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger && navMenu) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
      hamburger.classList.remove('active');
      navMenu.classList.remove('active');
    }
  });
}

// Navbar scroll effect
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;
  
  if (currentScroll > 100) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
  
  lastScroll = currentScroll;
});

// Intersection Observer for fade-in animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

// Observe all sections and cards
document.addEventListener('DOMContentLoaded', () => {
  const elementsToAnimate = document.querySelectorAll(
    '.section, .project-card, .skill-category, .feature-card, .experience-card, .education-group, .stat-item'
  );
  
  elementsToAnimate.forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
  });
});

// Typing effect for hero title (optional enhancement)
const heroTitle = document.querySelector('.hero-title');
if (heroTitle) {
  const text = heroTitle.innerHTML;
  heroTitle.innerHTML = '';
  let i = 0;
  
  const typeWriter = () => {
    if (i < text.length) {
      heroTitle.innerHTML += text.charAt(i);
      i++;
      setTimeout(typeWriter, 50);
    } else {
      // Restore original HTML structure
      heroTitle.innerHTML = text;
    }
  };
  
  // Uncomment to enable typing effect
  // setTimeout(typeWriter, 500);
}

// Active nav link highlighting on scroll
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
  let current = '';
  
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (window.pageYOffset >= sectionTop - 200) {
      current = section.getAttribute('id');
    }
  });
  
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
});

// Add active class styling
const style = document.createElement('style');
style.textContent = `
  .nav-link.active {
    color: var(--accent) !important;
  }
  .nav-link.active::after {
    width: 100% !important;
  }
`;
document.head.appendChild(style);

// Parallax effect for hero section (subtle)
window.addEventListener('scroll', () => {
  const scrolled = window.pageYOffset;
  const hero = document.querySelector('.hero');
  if (hero && scrolled < window.innerHeight) {
    hero.style.transform = `translateY(${scrolled * 0.5}px)`;
  }
});

// Counter animation for stats
const animateCounter = (element, target, duration = 2000) => {
  let start = 0;
  const increment = target / (duration / 16);
  
  const updateCounter = () => {
    start += increment;
    if (start < target) {
      element.textContent = Math.floor(start) + '+';
      requestAnimationFrame(updateCounter);
    } else {
      element.textContent = target + '+';
    }
  };
  
  updateCounter();
};

// Observe stats and animate when visible
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const statNumber = entry.target.querySelector('.stat-number');
      if (statNumber && !statNumber.dataset.animated) {
        const text = statNumber.textContent;
        const number = parseInt(text);
        if (!isNaN(number)) {
          statNumber.dataset.animated = 'true';
          animateCounter(statNumber, number);
        }
      }
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-item').forEach(stat => {
  statsObserver.observe(stat);
});

// Smooth reveal animation for project cards
const projectCards = document.querySelectorAll('.project-card');
projectCards.forEach((card, index) => {
  card.style.animationDelay = `${index * 0.2}s`;
});

// Add hover effect for project images
projectCards.forEach(card => {
  const image = card.querySelector('.project-image');
  if (image) {
    card.addEventListener('mouseenter', () => {
      image.style.transform = 'scale(1.05)';
    });
    card.addEventListener('mouseleave', () => {
      image.style.transform = 'scale(1)';
    });
  }
});

// Initialize AOS (Animate On Scroll)
if (typeof AOS !== 'undefined') {
  AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true,
    offset: 100,
    disable: function() {
      // Disable on mobile devices (width < 768px)
      return window.innerWidth < 768;
    }
  });
}

// Console message
console.log('%c👋 Hello! Welcome to my portfolio.', 'color: #3b82f6; font-size: 16px; font-weight: bold;');
console.log('%cBuilt with ❤️ by Yusuf Khan', 'color: #94a3b8; font-size: 12px;');
