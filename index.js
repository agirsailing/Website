/* ======================
   Constants & State
   ====================== */
const NAV_BAR       = document.getElementById('navBar');
const NAV_LIST      = document.getElementById('navList');
const HERO_HEADER   = document.getElementById('home');
const HAMBURGER_BTN = document.getElementById('hamburgerBtn');
const NAV_LINKS     = Array.from(document.querySelectorAll('.nav__list-link'));
const ACTIVE_CLASS  = 'active';
const BREAKPOINT    = 576;

/* ======================
   Dark / Light Mode
   ====================== */
const themeSwitch = document.getElementById('theme-switch');
const enableLightMode = () => {
  document.body.classList.add('lightmode');
  localStorage.setItem('lightmode', 'active');
};

const disableLightMode = () => {
  document.body.classList.remove('lightmode');
  localStorage.setItem('lightmode', null);
};

// Apply saved preference on load
if (localStorage.getItem('lightmode') === 'active') enableLightMode();
themeSwitch.addEventListener('click', () => {
  localStorage.getItem('lightmode') !== 'active' ? enableLightMode() : disableLightMode();
});

/* ======================
   Navbar — Hamburger
   ====================== */
const resetMobileNav = () => {
  NAV_LIST.classList.remove('nav--active');
  NAV_LIST.style.height = null;
  document.body.style.overflowY = null;
};

HAMBURGER_BTN.addEventListener('click', () => {
  const isOpen = NAV_LIST.classList.toggle('nav--active');
  NAV_LIST.style.height    = isOpen ? '100vh' : '0';
  document.body.style.overflowY = isOpen ? 'hidden' : null;
});

// Close mobile nav when a link is clicked
NAV_LINKS.forEach(link => {
  link.addEventListener('click', () => {
    resetMobileNav();
    link.blur();
  });
});

/* ======================
   Navbar — Hero Padding
   Compensates for fixed navbar height
   ====================== */
const syncHeroPadding = () => {
  if (NAV_LIST.classList.contains('nav--active')) return;
  const heightRem = NAV_BAR.getBoundingClientRect().height / 10;
  HERO_HEADER.style.paddingTop = `${heightRem}rem`;
};

syncHeroPadding();

window.addEventListener('resize', () => {
  syncHeroPadding();
  if (window.innerWidth >= BREAKPOINT) resetMobileNav();
});

/* ======================
   Scroll-spy
   Highlights the nav link matching the current page / section
   ====================== */
const normalizePath = (pathname) =>
  !pathname || pathname === '/' ? '/index.html' : pathname;

const resolveLinkUrl = (link) => {
  try { return new URL(link.getAttribute('href'), window.location.href); }
  catch { return null; }
};

let currentActiveLink = NAV_LINKS.find(l => l.classList.contains(ACTIVE_CLASS)) || null;

const clearActive = () => {
  NAV_LINKS.forEach(l => l.classList.remove(ACTIVE_CLASS));
  currentActiveLink = null;
};

const setActive = (link) => {
  if (!link || link === currentActiveLink) return;
  currentActiveLink?.classList.remove(ACTIVE_CLASS);
  link.classList.add(ACTIVE_CLASS);
  currentActiveLink = link;
};

// Match nav link to current URL path + hash
const updateActiveByPath = () => {
  clearActive();
  const locHash = window.location.hash;
  const locPath = normalizePath(window.location.pathname);

  // 1. Match by hash
  if (locHash) {
    const match = NAV_LINKS.find(l => resolveLinkUrl(l)?.hash === locHash);
    if (match) { setActive(match); return; }
  }

  // 2. Match by pathname
  const match = NAV_LINKS.find(l => {
    const u = resolveLinkUrl(l);
    return u && normalizePath(u.pathname) === locPath && !u.hash;
  });
  if (match) { setActive(match); return; }

  // 3. Fallback: highlight Home when on index
  if (locPath === '/index.html') {
    const homeLink = NAV_LINKS.find(l => {
      const u = resolveLinkUrl(l);
      return u && (u.hash === '#home' || l.getAttribute('href') === '#home');
    });
    if (homeLink) setActive(homeLink);
  }
};

// Match nav link to the section closest to the top of the viewport
const updateActiveOnScroll = () => {
  const sections = Array.from(document.querySelectorAll('section[id]'));
  if (!sections.length) return;

  const navHeight = NAV_BAR.getBoundingClientRect().height;
  const closest = sections.reduce((best, section) => {
    const dist = Math.abs(section.getBoundingClientRect().top - navHeight);
    return dist < best.dist ? { section, dist } : best;
  }, { section: null, dist: Infinity }).section;

  if (!closest) return;

  const byHash = NAV_LINKS.find(l => resolveLinkUrl(l)?.hash === `#${closest.id}`);
  if (byHash) { setActive(byHash); return; }

  const byPath = NAV_LINKS.find(l => {
    const u = resolveLinkUrl(l);
    return u && normalizePath(u.pathname) === normalizePath(window.location.pathname) && !u.hash;
  });
  if (byPath) setActive(byPath);
};

// Re-sync active link after clicking a nav item
NAV_LINKS.forEach(link => {
  link.addEventListener('click', () => {
    setTimeout(() => { updateActiveByPath(); updateActiveOnScroll(); }, 10);
  });
});

// Scroll listener (throttled via rAF)
let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { updateActiveOnScroll(); ticking = false; });
});

window.addEventListener('hashchange', updateActiveByPath);
window.addEventListener('popstate',   updateActiveByPath);

document.addEventListener('DOMContentLoaded', () => {
  updateActiveByPath();
  updateActiveOnScroll();
});

/* ======================
   Carousel
   ====================== */
document.querySelectorAll('.carousel').forEach(carousel => {
  const images  = Array.from(carousel.querySelectorAll('.carousel__image'));
  const prevBtn = carousel.querySelector('.carousel__btn.prev');
  const nextBtn = carousel.querySelector('.carousel__btn.next');
  let index = 0;

  const show = (i) => {
    images.forEach((img, n) => img.classList.toggle('active', n === i));
    index = i;
  };

  nextBtn?.addEventListener('click', () => show((index + 1) % images.length));
  prevBtn?.addEventListener('click', () => show((index - 1 + images.length) % images.length));
});

/* ======================
   Flip Cards
   ====================== */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.flip-card').forEach(card => {
    const inner = card.querySelector('.flip-card__inner');
    let autoFlipBack;

    // Click any image (not inside a link) to flip
    card.querySelectorAll('img').forEach(img => {
      img.addEventListener('click', (e) => {
        if (img.closest('.link-icon')) return;
        e.preventDefault();
        inner.classList.toggle('flipped');
      });
    });

    // Click back side to flip back
    card.querySelector('.flip-card__back').addEventListener('click', () => {
      inner.classList.remove('flipped');
    });

    // Auto flip back 4s after mouse leaves
    card.addEventListener('mouseleave', () => {
      if (inner.classList.contains('flipped')) {
        autoFlipBack = setTimeout(() => inner.classList.remove('flipped'), 4000);
      }
    });

    card.addEventListener('mouseenter', () => clearTimeout(autoFlipBack));
  });
});

/* ======================
   Extra Info Toggle
   (Timeline / competition expand buttons)
   ====================== */
const ICON_UP   = 'M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z';
const ICON_DOWN = 'M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z';

const extraInfo = (id) => {
  const moreText = document.getElementById(`more-info-${id}`);
  const space    = document.getElementById(`space-${id}`);
  const icon     = document.getElementById(`icon-${id}`)?.querySelector('path');
  if (!moreText) return;

  const isHidden = window.getComputedStyle(moreText).display === 'none';
  moreText.style.display = isHidden ? 'inline-block' : 'none';
  if (space) space.style.display = isHidden ? 'inline' : 'none';
  if (icon)  icon.setAttribute('d', isHidden ? ICON_UP : ICON_DOWN);
};

document.addEventListener('DOMContentLoaded', () => {
  // Button clicks
  document.querySelectorAll('.more-info__btn').forEach(btn => {
    btn.addEventListener('click', () => extraInfo(btn.id.replace('btn-', '')));
  });

  // Auto-collapse when scrolled out of view
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) return;
      const id   = entry.target.id.replace('more-info-', '');
      const space = document.getElementById(`space-${id}`);
      const icon  = document.getElementById(`icon-${id}`)?.querySelector('path');
      entry.target.style.display = 'none';
      if (space) space.style.display = 'none';
      if (icon)  icon.setAttribute('d', ICON_DOWN);
    });
  }, { threshold: 0.1 });

  document.querySelectorAll("[id^='more-info-']").forEach(el => observer.observe(el));
});

/* ======================
   Countdown
   ====================== */
var countDownDate = new Date("2026-06-08T21:59:00Z").getTime();

// Only run if countdown elements exist on this page
var countdownDaysEl = document.getElementById("countdown_days");

if (countdownDaysEl) {
  var x = setInterval(function() {
    var now = new Date().getTime();
    var distance = countDownDate - now;

    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

    var h = String(hours).padStart(2, '0');
    var m = String(minutes).padStart(2, '0');
    var s = String(seconds).padStart(2, '0');

    document.getElementById("countdown_days").innerHTML = days + "d ";
    document.getElementById("countdown_hours").innerHTML = h + "h ";
    document.getElementById("countdown_minutes").innerHTML = m + "m ";
    document.getElementById("countdown_seconds").innerHTML = s + "s ";

    if (distance < 0) {
      clearInterval(x);
      var expiredEl = document.getElementById("countdown");  
      if (expiredEl) expiredEl.innerHTML = "EXPIRED";
    }
  }, 1000);
}

/* ======================
   Team member presentation
   ====================== */
const popup = document.getElementById("memberPresentation");
const popupImg = document.getElementById('popupImg');
const popupName = document.getElementById('popupName');
const popupRole = document.getElementById('popupRole');
const popupDescription = document.getElementById('popupDescription');
const popupLink = document.getElementById('popupLink');

const members = Array.from(document.querySelectorAll('.team__member'));
let currentIndex = 0;

function showMember(index) {
  const member = members[index];
  const img = member.querySelector('img');
  const name = member.querySelector('.member__name');
  const role = member.querySelector('.member__role');
  const description = member.querySelector('.member__description');
  const link = member.querySelector('.member__link');

  popupImg.src = img.src;
  popupName.textContent = name.textContent;
  popupRole.textContent = role.textContent;
  popupDescription.textContent = description ? description.textContent : ''; // if no description, show empty string
  
  if (link && link.textContent.trim()) {
    popupLink.href = link.textContent.trim();
    popupLink.style.display = 'flex';
  } else {
    popupLink.href = '';
    popupLink.style.display = 'none'; // hide icon if no link
  }

  popup.classList.add('show');
}

document.querySelectorAll('.team__grid').forEach(grid => { 
  // one listener for whole grid
  grid.addEventListener('click', (e) => {                     
    const clickedMember = e.target.closest('.team__member'); // returns the closest element of the DOM tree
    if (clickedMember) {
      currentIndex = members.indexOf(clickedMember);
      showMember(currentIndex);
    }
  });
});

// close on clicking the X or outside the popup
document.getElementById('popupClose').addEventListener('click', () => {
  popup.classList.remove('show');
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') { popup.classList.remove('show'); }
});

document.getElementById('popupPrev').addEventListener('click', () => {
  currentIndex = (currentIndex - 1 + members.length) % members.length; // % remainder operator - ensures wrap-around without going negative
  showMember(currentIndex);
});

document.getElementById('popupNext').addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % members.length; // % remainder operator - wraps back to 0 after last member
  showMember(currentIndex);
});