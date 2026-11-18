import Swup from 'swup';
import SwupA11yPlugin from '@swup/a11y-plugin';
import SwupHeadPlugin from '@swup/head-plugin';
import { createScrollMenu } from './scroll-menu.js';

const scrollMenu = createScrollMenu();

async function revealInitialContent() {
    const root = document.documentElement;
    await document.fonts.ready;
    // Paint the hidden content with the final font before starting the same
    // opacity transition used when Swup reveals a newly loaded page.
    await new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
    if (!root.classList.contains('is-first-load')) return;
    root.classList.add('is-initial-rendering');
    root.classList.remove('is-first-load');
}

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

function prepareImages(root = document) {
    if (!root) return;

    function markReady(image) {
        if (!image.naturalWidth) return;
        image.classList.add('image-reveal--ready');
        image
            .closest('.image-placeholder')
            ?.classList.add('image-placeholder--ready');
    }

    root.querySelectorAll('img').forEach((image) => {
        if (image.complete) {
            markReady(image);
            return;
        }

        const ready =
            typeof image.decode === 'function'
                ? image.decode().catch(() => {
                      if (!image.complete) return waitForImageLoad(image);
                  })
                : waitForImageLoad(image);

        ready.then(() => markReady(image));
    });
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

    document.querySelectorAll('.site-brand').forEach((brand) => {
        if (pageKey === 'main') brand.setAttribute('aria-current', 'page');
        else brand.removeAttribute('aria-current');
    });

    scrollMenu.refresh(page.dataset.pageLabel);
}

const swup = new Swup({
    containers: ['#page-intro', '#main-content'],
    animationSelector: '[data-page-transition]',
    plugins: [new SwupA11yPlugin(), new SwupHeadPlugin()],
});

prepareImages();
revealInitialContent();

swup.hooks.on('page:view', () => {
    prepareImages(document.querySelector('#main-content'));
    updatePersistentElements();
});
swup.hooks.on('visit:start', () => {
    document.documentElement.classList.remove('is-first-load', 'is-initial-rendering');
    scrollMenu.suspend();
});
for (const hook of ['visit:abort', 'visit:end', 'visit:fail']) {
    swup.hooks.on(hook, () => scrollMenu.resume());
}
