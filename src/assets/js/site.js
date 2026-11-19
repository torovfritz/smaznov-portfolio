import Swup from 'swup';
import SwupA11yPlugin from '@swup/a11y-plugin';
import SwupHeadPlugin from '@swup/head-plugin';
import { animate } from 'motion/mini';
import { createScrollMenu } from './scroll-menu.js';
import { createGallery } from './gallery.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const scrollMenu = createScrollMenu();
let destroyGallery = createGallery(document.querySelector('[data-gallery]'));
const imageWaitLimit = 400;
const portrait = document.querySelector('.site-header .site-brand__portrait');
const portraitImage = portrait?.querySelector('.portrait__image');
const originalPortraitSrc = portraitImage?.getAttribute('src');
const portraitLooks = [
    originalPortraitSrc,
    '/assets/images/portrait-look-left.png',
    originalPortraitSrc,
    '/assets/images/portrait-look-right.png',
];
let brandClickCount = 0;
let lastBrandClick = 0;
let portraitSequence = 0;
let portraitPlaying = false;

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

const portraitFramesReady = Promise.all([...new Set(portraitLooks)].filter(Boolean).map(async (src) => {
    const image = new Image();
    image.src = src;
    if (typeof image.decode === 'function') await image.decode();
    else await waitForImageLoad(image);
    if (!image.naturalWidth) throw new Error(`Could not load ${src}`);
})).then(() => true, () => false);

function resetPortraitSequence() {
    portraitSequence += 1;
    portraitPlaying = false;
    brandClickCount = 0;
    if (portraitImage && originalPortraitSrc) portraitImage.src = originalPortraitSrc;
}

async function playPortraitSequence() {
    if (!portraitImage || !originalPortraitSrc || portraitPlaying) return;
    portraitPlaying = true;
    const sequence = ++portraitSequence;

    try {
        if (!(await portraitFramesReady) || sequence !== portraitSequence) return;
        const frames = reducedMotion.matches ? [portraitLooks[1]] : portraitLooks;
        for (const src of frames) {
            if (sequence !== portraitSequence) return;
            portraitImage.src = src;
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
    } finally {
        if (sequence === portraitSequence) {
            portraitImage.src = originalPortraitSrc;
            portraitPlaying = false;
        }
    }
}

function prepareImages(root = document) {
    const pending = new Map();
    if (!root) return pending;

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

        pending.set(
            image,
            ready.then(() => {
                markReady(image);
            }),
        );
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
        new Promise((resolve) => {
            timeout = window.setTimeout(resolve, imageWaitLimit);
        }),
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
        if (current) {
            link.setAttribute('aria-current', 'page');
            link.setAttribute('aria-disabled', 'true');
            link.setAttribute('tabindex', '-1');
        } else {
            link.removeAttribute('aria-current');
            link.removeAttribute('aria-disabled');
            link.removeAttribute('tabindex');
        }
    });

    document.querySelectorAll('.site-brand').forEach((brand) => {
        if (pageKey === 'main') brand.setAttribute('aria-current', 'page');
        else brand.removeAttribute('aria-current');
    });

    scrollMenu.refresh(page.dataset.pageLabel);
}

const swup = new Swup({
    containers: ['#page-intro', '#main-content'],
    animationSelector: false,
    plugins: [new SwupA11yPlugin(), new SwupHeadPlugin()],
});

document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest('a[aria-current="page"]');
    if (!link || (!link.matches('[data-nav-key]') && !link.matches('.site-brand'))) return;

    event.preventDefault();
    event.stopPropagation();

    if (!portraitImage || !link.closest('.site-header') || portraitPlaying) return;
    const now = performance.now();
    brandClickCount = now - lastBrandClick < 1500 ? brandClickCount + 1 : 1;
    lastBrandClick = now;
    if (brandClickCount < 3) return;

    brandClickCount = 0;
    void playPortraitSequence();
}, true);

prepareImages();

swup.hooks.replace('animation:out:await', async (visit) => {
    if (!visit.animation.animate || reducedMotion.matches) return;

    await animate(
        '[data-page-transition]',
        {
            opacity: [1, 0],
        },
        { duration: 0.2, ease: 'easeInOut' },
    );

    if (!visit.done)
        document.documentElement.classList.add('page-enter-pending');
});

swup.hooks.replace('animation:in:await', async (visit) => {
    const pending = prepareImages(document.querySelector('#main-content'));
    if (!visit.animation.animate || reducedMotion.matches) {
        document.documentElement.classList.remove('page-enter-pending');
        return;
    }

    try {
        await waitForVisibleImages(pending);

        const animation = animate(
            '[data-page-transition]',
            {
                opacity: [0, 1],
            },
            { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
        );

        document.documentElement.classList.remove('page-enter-pending');
        await animation;
        animation.cancel();
    } finally {
        document.documentElement.classList.remove('page-enter-pending');
    }
});

swup.hooks.on('page:view', () => {
    destroyGallery();
    destroyGallery = createGallery(document.querySelector('[data-gallery]'));
    updatePersistentElements();
});
swup.hooks.on('visit:start', () => {
    resetPortraitSequence();
    scrollMenu.suspend();
});
for (const hook of ['visit:abort', 'visit:end', 'visit:fail']) {
    swup.hooks.on(hook, () => {
        document.documentElement.classList.remove('page-enter-pending');
        scrollMenu.resume();
    });
}
