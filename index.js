/* ======================
   Shared Constants
   ====================== */
const ACTIVE_CLASS = 'active';
const BREAKPOINT = 576;
const ICON_UP = 'M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z';
const ICON_DOWN = 'M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z';

/* ======================
   Shared Layout Loader
   ====================== */
async function loadSharedPart(id, file) {
  const container = document.getElementById(id);
  if (!container) return;

  const response = await fetch(file);
  if (!response.ok) {
    throw new Error(`Failed to load ${file}: ${response.status}`);
  }

  container.innerHTML = await response.text();
}

async function loadLayout() {
  await loadSharedPart('site-header', 'header.html');
  await loadSharedPart('site-footer', 'footer.html');
}

/* ======================
   Helpers
   ====================== */
function normalizePath(pathname) {
  return !pathname || pathname === '/' ? '/index.html' : pathname;
}

function resolveLinkUrl(link) {
  try {
    return new URL(link.getAttribute('href'), window.location.href);
  } catch {
    return null;
  }
}

/* ======================
   Dark / Light Mode
   ====================== */
function initTheme() {
  const themeSwitch = document.getElementById('theme-switch');
  if (!themeSwitch) return;

  const enableLightMode = () => {
    document.body.classList.add('lightmode');
    localStorage.setItem('lightmode', 'active');
  };

  const disableLightMode = () => {
    document.body.classList.remove('lightmode');
    localStorage.setItem('lightmode', null);
  };

  if (localStorage.getItem('lightmode') === 'active') {
    enableLightMode();
  }

  themeSwitch.addEventListener('click', () => {
    if (localStorage.getItem('lightmode') !== 'active') {
      enableLightMode();
    } else {
      disableLightMode();
    }
  });
}

/* ======================
   Navbar
   ====================== */
function initNavbar() {
  const NAV_BAR = document.getElementById('navBar');
  const NAV_LIST = document.getElementById('navList');
  const HERO_HEADER = document.getElementById('home');
  const HAMBURGER_BTN = document.getElementById('hamburgerBtn');
  const NAV_LINKS = Array.from(document.querySelectorAll('.nav__list-link'));

  if (!NAV_BAR || !NAV_LIST || !HAMBURGER_BTN || !NAV_LINKS.length) return;

  let currentActiveLink =
    NAV_LINKS.find((link) => link.classList.contains(ACTIVE_CLASS)) || null;

  let ticking = false;

  const resetMobileNav = () => {
    NAV_LIST.classList.remove('nav--active');
    NAV_LIST.style.height = null;
    document.body.style.overflowY = null;
  };

  const syncHeroPadding = () => {
    if (!HERO_HEADER) return;
    if (NAV_LIST.classList.contains('nav--active')) return;

    const heightRem = NAV_BAR.getBoundingClientRect().height / 10;
    HERO_HEADER.style.paddingTop = `${heightRem}rem`;
  };

  const clearActive = () => {
    NAV_LINKS.forEach((link) => link.classList.remove(ACTIVE_CLASS));
    currentActiveLink = null;
  };

  const setActive = (link) => {
    if (!link || link === currentActiveLink) return;

    if (currentActiveLink) {
      currentActiveLink.classList.remove(ACTIVE_CLASS);
    }

    link.classList.add(ACTIVE_CLASS);
    currentActiveLink = link;
  };

  const updateActiveByPath = () => {
    clearActive();

    const locHash = window.location.hash;
    const locPath = normalizePath(window.location.pathname);

    if (locHash) {
      const hashMatch = NAV_LINKS.find(
        (link) => resolveLinkUrl(link)?.hash === locHash
      );
      if (hashMatch) {
        setActive(hashMatch);
        return;
      }
    }

    const pathMatch = NAV_LINKS.find((link) => {
      const url = resolveLinkUrl(link);
      return url && normalizePath(url.pathname) === locPath && !url.hash;
    });

    if (pathMatch) {
      setActive(pathMatch);
      return;
    }

    if (locPath === '/index.html') {
      const homeLink = NAV_LINKS.find((link) => {
        const url = resolveLinkUrl(link);
        return url && (url.hash === '#home' || link.getAttribute('href') === '#home');
      });

      if (homeLink) setActive(homeLink);
    }
  };

  const updateActiveOnScroll = () => {
    const sections = Array.from(document.querySelectorAll('section[id]'));
    if (!sections.length) return;

    const navHeight = NAV_BAR.getBoundingClientRect().height;

    const closest = sections.reduce(
      (best, section) => {
        const dist = Math.abs(section.getBoundingClientRect().top - navHeight);
        return dist < best.dist ? { section, dist } : best;
      },
      { section: null, dist: Infinity }
    ).section;

    if (!closest) return;

    const byHash = NAV_LINKS.find(
      (link) => resolveLinkUrl(link)?.hash === `#${closest.id}`
    );
    if (byHash) {
      setActive(byHash);
      return;
    }

    const byPath = NAV_LINKS.find((link) => {
      const url = resolveLinkUrl(link);
      return (
        url &&
        normalizePath(url.pathname) === normalizePath(window.location.pathname) &&
        !url.hash
      );
    });

    if (byPath) setActive(byPath);
  };

  HAMBURGER_BTN.addEventListener('click', () => {
    const isOpen = NAV_LIST.classList.toggle('nav--active');
    NAV_LIST.style.height = isOpen ? '100vh' : '0';
    document.body.style.overflowY = isOpen ? 'hidden' : null;
  });

  NAV_LINKS.forEach((link) => {
    link.addEventListener('click', () => {
      resetMobileNav();
      link.blur();

      setTimeout(() => {
        updateActiveByPath();
        updateActiveOnScroll();
      }, 10);
    });
  });

  syncHeroPadding();
  updateActiveByPath();
  updateActiveOnScroll();

  window.addEventListener('resize', () => {
    syncHeroPadding();
    if (window.innerWidth >= BREAKPOINT) resetMobileNav();
  });

  window.addEventListener('scroll', () => {
    if (ticking) return;

    ticking = true;
    requestAnimationFrame(() => {
      updateActiveOnScroll();
      ticking = false;
    });
  });

  window.addEventListener('hashchange', updateActiveByPath);
  window.addEventListener('popstate', updateActiveByPath);
}

/* ======================
   Carousel
   ====================== */
function initCarousels() {
  document.querySelectorAll('.carousel').forEach((carousel) => {
    const images = Array.from(carousel.querySelectorAll('.carousel__image'));
    const prevBtn = carousel.querySelector('.carousel__btn.prev');
    const nextBtn = carousel.querySelector('.carousel__btn.next');

    if (!images.length) return;

    let index = 0;

    const show = (i) => {
      images.forEach((img, n) => img.classList.toggle('active', n === i));
      index = i;
    };

    nextBtn?.addEventListener('click', () => {
      show((index + 1) % images.length);
    });

    prevBtn?.addEventListener('click', () => {
      show((index - 1 + images.length) % images.length);
    });
  });
}

/* ======================
   Flip Cards
   ====================== */
function initFlipCards() {
  document.querySelectorAll('.flip-card').forEach((card) => {
    const inner = card.querySelector('.flip-card__inner');
    const back = card.querySelector('.flip-card__back');
    if (!inner || !back) return;

    let autoFlipBack;

    card.querySelectorAll('img').forEach((img) => {
      img.addEventListener('click', (e) => {
        if (img.closest('.link-icon')) return;
        e.preventDefault();
        inner.classList.toggle('flipped');
      });
    });

    back.addEventListener('click', () => {
      inner.classList.remove('flipped');
    });

    card.addEventListener('mouseleave', () => {
      if (inner.classList.contains('flipped')) {
        autoFlipBack = setTimeout(() => {
          inner.classList.remove('flipped');
        }, 4000);
      }
    });

    card.addEventListener('mouseenter', () => {
      clearTimeout(autoFlipBack);
    });
  });
}

/* ======================
   Extra Info Toggle
   ====================== */
function extraInfo(id) {
  const moreText = document.getElementById(`more-info-${id}`);
  const space = document.getElementById(`space-${id}`);
  const icon = document.getElementById(`icon-${id}`)?.querySelector('path');

  if (!moreText) return;

  const isHidden = window.getComputedStyle(moreText).display === 'none';

  moreText.style.display = isHidden ? 'inline-block' : 'none';
  if (space) space.style.display = isHidden ? 'inline' : 'none';
  if (icon) icon.setAttribute('d', isHidden ? ICON_UP : ICON_DOWN);
}

function initExtraInfo() {
  const buttons = document.querySelectorAll('.more-info__btn');
  const infoBlocks = document.querySelectorAll("[id^='more-info-']");

  if (!buttons.length && !infoBlocks.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      extraInfo(btn.id.replace('btn-', ''));
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) return;

        const id = entry.target.id.replace('more-info-', '');
        const space = document.getElementById(`space-${id}`);
        const icon = document.getElementById(`icon-${id}`)?.querySelector('path');

        entry.target.style.display = 'none';
        if (space) space.style.display = 'none';
        if (icon) icon.setAttribute('d', ICON_DOWN);
      });
    },
    { threshold: 0.1 }
  );

  infoBlocks.forEach((el) => observer.observe(el));
}

/* ======================
   Countdown
   ====================== */
function initCountdown() {
  const countDownDate = new Date('2026-06-07T21:59:00Z').getTime();
  const countdownDaysEl = document.getElementById('countdown_days');

  if (!countdownDaysEl) return;

  const intervalId = setInterval(() => {
    const now = new Date().getTime();
    const distance = countDownDate - now;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const h = String(hours).padStart(2, '0');
    const m = String(minutes).padStart(2, '0');
    const s = String(seconds).padStart(2, '0');

    const daysEl = document.getElementById('countdown_days');
    const hoursEl = document.getElementById('countdown_hours');
    const minutesEl = document.getElementById('countdown_minutes');
    const secondsEl = document.getElementById('countdown_seconds');

    if (daysEl) daysEl.innerHTML = `${days}d `;
    if (hoursEl) hoursEl.innerHTML = `${h}h `;
    if (minutesEl) minutesEl.innerHTML = `${m}m `;
    if (secondsEl) secondsEl.innerHTML = `${s}s `;

    if (distance < 0) {
    clearInterval(intervalId);
    const labelEl = document.querySelector('.countdown__label');
    const displayEl = document.querySelector('.countdown__display');
    if (labelEl) labelEl.textContent = "See you in next year's edition !";
    if (displayEl) {displayEl.innerHTML = ''; } // hide numbers
  }
  }, 1000);
}

/* ======================
   Reusable Popup Gallery
   ----------------------
   Shared by the team-member popup and the open-position popup.
   `items` is the list of elements the popup can show, `render`
   fills the popup from one of those elements.
   ====================== */
function createPopupGallery({ popup, prevBtn, nextBtn, closeBtn, items, render }) {
  if (!popup || !items.length || typeof render !== 'function') return null;

  let currentIndex = 0;
  let lastTrigger = null;

  const isOpen = () => popup.classList.contains('show');

  const show = (index) => {
    const nextIndex = (index + items.length) % items.length;
    const item = items[nextIndex];
    if (!item) return;

    currentIndex = nextIndex;
    render(item, nextIndex, items.length);

    popup.classList.add('show');
    popup.setAttribute('aria-hidden', 'false');
  };

  const hide = () => {
    if (!isOpen()) return;

    popup.classList.remove('show');
    popup.setAttribute('aria-hidden', 'true');

    lastTrigger?.focus();
    lastTrigger = null;
  };

  const step = (offset) => {
    if (isOpen()) show(currentIndex + offset);
  };

  const openAt = (item, trigger = null) => {
    const index = items.indexOf(item);
    if (index === -1) return;

    lastTrigger = trigger;
    show(index);
  };

  prevBtn?.addEventListener('click', () => step(-1));
  nextBtn?.addEventListener('click', () => step(1));
  closeBtn?.addEventListener('click', hide);

  document.addEventListener('keydown', (event) => {
    if (!isOpen()) return;

    if (event.key === 'Escape') hide();
    if (event.key === 'ArrowLeft') step(-1);
    if (event.key === 'ArrowRight') step(1);
  });

  // Clicking the dimmed backdrop closes the popup.
  popup.addEventListener('click', (event) => {
    if (event.target === popup) hide();
  });

  return { show, hide, step, openAt, isOpen };
}

/* ======================
   Team Member Presentation
   ====================== */
function initTeamPopup() {
  const popup = document.getElementById('memberPresentation');
  const popupImg = document.getElementById('popupImg');
  const popupName = document.getElementById('popupName');
  const popupRole = document.getElementById('popupRole');
  const popupDescription = document.getElementById('popupDescription');
  const popupLink = document.getElementById('popupLink');
  const popupClose = document.getElementById('popupClose');
  const popupPrev = document.getElementById('popupPrev');
  const popupNext = document.getElementById('popupNext');

  const members = Array.from(document.querySelectorAll('.team__member'));
  // `.team-structure` covers the generated layout on team.html.
  const teamGrids = document.querySelectorAll('.team__grid, .team-structure');

  if (
    !popup ||
    !popupImg ||
    !popupName ||
    !popupRole ||
    !popupDescription ||
    !popupLink ||
    !popupClose ||
    !popupPrev ||
    !popupNext ||
    !members.length ||
    !teamGrids.length
  ) {
    return;
  }

  function showMember(member) {
    const img = member.querySelector('img');
    const name = member.querySelector('.member__name');
    const role = member.querySelector('.member__role');
    const description = member.querySelector('.member__description');
    const link = member.querySelector('.member__link');

    if (img) popupImg.src = img.src;
    popupName.textContent = name ? name.textContent : '';
    popupRole.textContent = role ? role.textContent : '';
    popupDescription.textContent = description ? description.textContent : '';

    if (link && link.textContent.trim()) {
      popupLink.href = link.textContent.trim();
      popupLink.style.display = 'flex';
    } else {
      popupLink.href = '';
      popupLink.style.display = 'none';
    }

  }

  const gallery = createPopupGallery({
    popup,
    prevBtn: popupPrev,
    nextBtn: popupNext,
    closeBtn: popupClose,
    items: members,
    render: showMember
  });

  if (!gallery) return;

  teamGrids.forEach((grid) => {
    grid.addEventListener('click', (e) => {
      const clickedMember = e.target.closest('.team__member');
      if (!clickedMember) return;

      gallery.openAt(clickedMember);
    });
  });
}

/* ======================
   Open Positions Presentation
   ====================== */
function initRecruitPopup() {
  const popup = document.getElementById('recruitPresentation');
  const popupTitle = document.getElementById('recruitPopupTitle');
  const popupSubtitle = document.getElementById('recruitPopupSubtitle');
  const popupBody = document.getElementById('recruitPopupBody');
  const popupLink = document.getElementById('recruitPopupLink');
  const popupCounter = document.getElementById('recruitPopupCounter');
  const popupClose = document.getElementById('recruitPopupClose');
  const popupPrev = document.getElementById('recruitPopupPrev');
  const popupNext = document.getElementById('recruitPopupNext');

  const grids = document.querySelectorAll('.recruit__grid');
  const positions = Array.from(document.querySelectorAll('.recruit__item'));

  if (
    !popup ||
    !popupTitle ||
    !popupSubtitle ||
    !popupBody ||
    !popupClose ||
    !popupPrev ||
    !popupNext ||
    !grids.length ||
    !positions.length
  ) {
    return;
  }

  function showPosition(item, index, total) {
    const title = item.querySelector('.recruit__title');
    const subtitle = item.querySelector('.recruit__subtitle');
    const details = item.querySelector('.recruit__details');
    const shortMsg = item.querySelector('.recruit__msg');
    const link = item.querySelector('.recruit__link');

    popupTitle.textContent = title ? title.textContent.trim() : '';
    popupSubtitle.textContent = subtitle ? subtitle.textContent.trim() : '';

    const clean = (text) => text.replace(/\s+/g, ' ').trim();
    const fullMsg = shortMsg ? clean(shortMsg.textContent) : '';

    if (details) {
      popupBody.innerHTML = details.innerHTML;

      // The card clips its text; show the full version at the top of the popup,
      // unless the same paragraph is already written in the details.
      const alreadyShown = Array.from(popupBody.querySelectorAll('p'))
        .some((p) => clean(p.textContent) === fullMsg);

      if (fullMsg && !alreadyShown) {
        const lead = document.createElement('p');
        lead.className = 'recruit-popup__lead';
        lead.textContent = fullMsg;

        const meta = popupBody.querySelector('.recruit__meta');
        if (meta) meta.after(lead);
        else popupBody.prepend(lead);
      }
    } else {
      popupBody.textContent = fullMsg;
    }

    if (popupLink) {
      const href = link?.getAttribute('href')?.trim();

      if (href) {
        popupLink.href = href;
        popupLink.textContent = link.textContent.trim() || 'Apply for this position';
        popupLink.style.display = 'inline-flex';
      } else {
        popupLink.removeAttribute('href');
        popupLink.style.display = 'none';
      }
    }

    if (popupCounter) {
      popupCounter.textContent = total > 1 ? `${index + 1} / ${total}` : '';
    }

    // One position only: nothing to scroll through.
    popupPrev.hidden = total < 2;
    popupNext.hidden = total < 2;

    popupBody.scrollTop = 0;
  }

  const gallery = createPopupGallery({
    popup,
    prevBtn: popupPrev,
    nextBtn: popupNext,
    closeBtn: popupClose,
    items: positions,
    render: showPosition
  });

  if (!gallery) return;

  // One listener per grid, so every section's + buttons open the popup.
  grids.forEach((grid) => {
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.recruit__more-btn');
      if (!btn) return;

      const item = btn.closest('.recruit__item');
      if (item) gallery.openAt(item, btn);
    });
  });
}

/* ======================
   App Init
   ====================== */
document.addEventListener('DOMContentLoaded', async () => {
  await loadLayout();

  initTheme();
  initNavbar();
  initCarousels();
  initFlipCards();
  initExtraInfo();
  initCountdown();
  initTeamPopup();
  initRecruitPopup();
  initNewsletterWidget();
});

/* ======================
   Newsletter Widget
====================== */
function initNewsletterWidget() {
  const toggle = document.getElementById('newsletterToggle');
  const popup = document.getElementById('newsletterPopup');
  const close = document.getElementById('newsletterClose');
  const form = document.getElementById('mc-embedded-subscribe-form');
  const message = document.getElementById('newsletterMessage');

  if (!toggle || !popup || !close) return;

  toggle.addEventListener('click', () => {
    popup.classList.toggle('is-open');
  });

  close.addEventListener('click', () => {
    popup.classList.remove('is-open');
  });

  /*
  form?.addEventListener('submit', () => {
    if (message) {
      message.textContent = 'Thank you! Please check your inbox to confirm.';
    }
  });*/

  form?.addEventListener('submit', (event) => {
    if (!form.checkValidity()) {
      event.preventDefault();
      form.reportValidity();
      return;
    }

    setTimeout(() => {
      form.reset();
      popup.classList.remove('is-open');
    }, 500);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      popup.classList.remove('is-open');
    }
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.newsletter-widget')) {
      popup.classList.remove('is-open');
    }
  });
}