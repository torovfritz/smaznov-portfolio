export function createScrollMenu() {
  const menu = document.querySelector('[data-scroll-menu]');
  if (!menu) return { refresh() {}, suspend() {}, resume() {} };

  const button = menu.querySelector('[data-scroll-menu-button]');
  const label = menu.querySelector('[data-scroll-menu-label]');
  const narrowScreen = window.matchMedia('(max-width: 1080px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let expansionTimer;
  let hideTimer;
  let frame;
  let suspended = false;

  function updateWidth() {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const labelWidth = label.scrollWidth;
    const revealDuration = Math.min(600, Math.max(250, Math.round(labelWidth * 4.8)));
    menu.style.setProperty('--scroll-menu-expanded-width', `${labelWidth + 54 * rem / 16}px`);
    menu.style.setProperty('--scroll-menu-reveal-duration', `${revealDuration}ms`);
  }

  function update() {
    frame = 0;
    if (suspended) return;
    const title = document.querySelector('#page-title');
    const visible = title && narrowScreen.matches && title.getBoundingClientRect().bottom <= 0;

    if (visible) {
      clearTimeout(hideTimer);
      const wasVisible = menu.classList.contains('scroll-menu--visible');
      const wasLeaving = menu.classList.contains('scroll-menu--leaving');
      menu.hidden = false;
      updateWidth();
      menu.classList.remove('scroll-menu--leaving');
      menu.classList.add('scroll-menu--visible');
      if (reducedMotion.matches) {
        clearTimeout(expansionTimer);
        menu.classList.add('scroll-menu--expanded');
      } else if (wasLeaving) {
        menu.classList.add('scroll-menu--expanded');
      } else if (!wasVisible) {
        expansionTimer = setTimeout(() => menu.classList.add('scroll-menu--expanded'), 198);
      }
    } else {
      clearTimeout(expansionTimer);
      if (menu.hidden) return;

      if (reducedMotion.matches || !narrowScreen.matches) {
        clearTimeout(hideTimer);
        menu.classList.remove('scroll-menu--expanded', 'scroll-menu--visible', 'scroll-menu--leaving');
        menu.hidden = true;
      } else if (!menu.classList.contains('scroll-menu--leaving')) {
        menu.classList.add('scroll-menu--leaving');
        hideTimer = setTimeout(() => {
          menu.hidden = true;
          menu.classList.remove('scroll-menu--expanded', 'scroll-menu--visible', 'scroll-menu--leaving');
        }, 200);
      }
    }
  }

  function scheduleUpdate() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  });
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  narrowScreen.addEventListener('change', scheduleUpdate);
  reducedMotion.addEventListener('change', scheduleUpdate);
  document.fonts.ready.then(scheduleUpdate);
  update();

  return {
    suspend() {
      suspended = true;
      clearTimeout(expansionTimer);
      clearTimeout(hideTimer);
      cancelAnimationFrame(frame);
      frame = 0;
      menu.hidden = true;
      menu.classList.remove('scroll-menu--expanded', 'scroll-menu--visible', 'scroll-menu--leaving');
    },
    resume() {
      suspended = false;
      scheduleUpdate();
    },
    refresh(pageLabel) {
      label.textContent = pageLabel;
      update();
      scheduleUpdate();
    }
  };
}
