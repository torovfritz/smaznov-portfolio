import Swup from 'swup';
import SwupA11yPlugin from '@swup/a11y-plugin';
import SwupHeadPlugin from '@swup/head-plugin';
import { animate } from 'motion/mini';
import { createScrollMenu } from './scroll-menu.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const scrollMenu = createScrollMenu();
const imageWaitLimit = 400;

function waitForImageLoad(image) {
  return new Promise((resolve) => {
    const settle = () => {
      image.removeEventListener('load', settle);
      image.removeEventListener('error', settle);
      resolve();
    };
    image.addEventListener('load', settle);
    image.addEventListener('error', settle);
    if (image.complete) settle();
  });
}

function prepareImages() {
  const page = document.querySelector('#main-content');
  const pending = new Map();
  if (!page) return pending;

  page.querySelectorAll('img').forEach((image) => {
    if (image.complete) {
      image.classList.add('image-reveal--ready');
      return;
    }

    const ready = typeof image.decode === 'function'
      ? image.decode().catch(() => {
        if (!image.complete) return waitForImageLoad(image);
      })
      : waitForImageLoad(image);

    pending.set(image, ready.then(() => {
      image.classList.add('image-reveal--ready');
    }));
  });

  return pending;
}

async function waitForVisibleImages(pending) {
  const visible = [...pending].filter(([image]) => {
    const bounds = image.getBoundingClientRect();
    return bounds.top < window.innerHeight && bounds.bottom > 0;
  });
  if (!visible.length) return;

  let timeout;
  await Promise.race([
    Promise.all(visible.map(([, ready]) => ready)),
    new Promise((resolve) => { timeout = window.setTimeout(resolve, imageWaitLimit); })
  ]);
  window.clearTimeout(timeout);
}

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

prepareImages();

swup.hooks.replace('animation:out:await', async (visit) => {
  if (!visit.animation.animate || reducedMotion.matches) return;

  await animate('[data-page-transition]', {
    opacity: [1, 0],
    transform: ['none', 'translateY(-4px)']
  }, { duration: 0.2, ease: 'easeInOut' });

  if (!visit.done) document.documentElement.classList.add('page-enter-pending');
});

swup.hooks.replace('animation:in:await', async (visit) => {
  const pending = prepareImages();
  if (!visit.animation.animate || reducedMotion.matches) {
    document.documentElement.classList.remove('page-enter-pending');
    return;
  }

  try {
    await waitForVisibleImages(pending);

    const animation = animate('[data-page-transition]', {
      opacity: [0, 1],
      transform: ['translateY(4px)', 'none']
    }, { duration: 0.3, ease: [0.22, 1, 0.36, 1] });

    document.documentElement.classList.remove('page-enter-pending');
    await animation;
    animation.cancel();
  } finally {
    document.documentElement.classList.remove('page-enter-pending');
  }
});

swup.hooks.on('page:view', updatePersistentElements);
swup.hooks.on('visit:abort', () => document.documentElement.classList.remove('page-enter-pending'));
swup.hooks.on('visit:end', () => document.documentElement.classList.remove('page-enter-pending'));
swup.hooks.on('visit:fail', () => document.documentElement.classList.remove('page-enter-pending'));
