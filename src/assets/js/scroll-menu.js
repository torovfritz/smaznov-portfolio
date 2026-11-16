const menu = document.querySelector('[data-scroll-menu]');
const title = document.querySelector('#page-title');

if (menu && title) {
  const button = menu.querySelector('[data-scroll-menu-button]');
  const label = menu.querySelector('[data-scroll-menu-label]');
  const narrowScreen = window.matchMedia('(max-width: 1080px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let expansionTimer;
  let frame;

  function updateWidth() {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    menu.style.setProperty('--scroll-menu-expanded-width', `${label.scrollWidth + 54 * rem / 16}px`);
  }

  function update() {
    frame = 0;
    const visible = narrowScreen.matches && title.getBoundingClientRect().bottom <= 0;

    if (visible) {
      const wasVisible = menu.classList.contains('scroll-menu--visible');
      menu.hidden = false;
      updateWidth();
      menu.classList.add('scroll-menu--visible');
      if (reducedMotion.matches) {
        clearTimeout(expansionTimer);
        menu.classList.add('scroll-menu--expanded');
      } else if (!wasVisible) {
        expansionTimer = setTimeout(() => menu.classList.add('scroll-menu--expanded'), 130);
      }
    } else {
      clearTimeout(expansionTimer);
      menu.classList.remove('scroll-menu--expanded', 'scroll-menu--visible');
      menu.hidden = true;
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
}
