import Swup from 'swup';
import SwupA11yPlugin from '@swup/a11y-plugin';
import SwupHeadPlugin from '@swup/head-plugin';
import { animate } from 'motion/mini';
import { createScrollMenu } from './scroll-menu.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const scrollMenu = createScrollMenu();

function updatePersistentElements() {
  const page = document.querySelector('#main-content');
  if (!page) return;

  const pageKey = page.dataset.pageKey;
  document.querySelectorAll('[data-nav-key]').forEach((link) => {
    const current = link.dataset.navKey === pageKey;
    link.classList.toggle('site-nav__link--current', current);
    if (current) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  const brand = document.querySelector('.site-brand');
  if (pageKey === 'main') brand.setAttribute('aria-current', 'page');
  else brand.removeAttribute('aria-current');

  scrollMenu.refresh(page.dataset.pageLabel);
}

const swup = new Swup({
  containers: ['#page-intro', '#main-content'],
  animationSelector: false,
  plugins: [new SwupA11yPlugin(), new SwupHeadPlugin()]
});

swup.hooks.replace('animation:out:await', async (visit) => {
  if (!visit.animation.animate || reducedMotion.matches) return;

  await animate('[data-page-transition]', {
    opacity: [1, 0],
    transform: ['none', 'translateY(-4px)']
  }, { duration: 0.2, ease: 'easeInOut' });
});

swup.hooks.replace('animation:in:await', async (visit) => {
  if (!visit.animation.animate || reducedMotion.matches) return;

  const animation = animate('[data-page-transition]', {
    opacity: [0, 1],
    transform: ['translateY(4px)', 'none']
  }, { duration: 0.3, ease: [0.22, 1, 0.36, 1] });

  await animation;
  animation.cancel();
});

swup.hooks.on('page:view', updatePersistentElements);
