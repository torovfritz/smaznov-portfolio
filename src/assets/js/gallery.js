export function createGallery(root) {
    if (!root) return () => {};

    const mobile = window.matchMedia('(max-width: 520px)');
    const medium = window.matchMedia('(min-width: 521px) and (max-width: 1080px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const items = [...root.querySelectorAll('[data-gallery-item]')];
    const revealed = new WeakSet();
    const main = root.closest('.site-layout__content');
    const footer = document.querySelector('.site-footer');
    let frame = 0;

    function update() {
        frame = 0;
        if (!items.length) return;

        const viewportHeight = window.innerHeight;
        const center = viewportHeight / 2;
        const firstInfo = items[0].querySelector('[data-gallery-info]');
        const lastInfo = items[items.length - 1].querySelector('[data-gallery-info]');
        const firstInfoMargin = parseFloat(getComputedStyle(firstInfo).marginTop) || 0;
        const lastInfoMargin = parseFloat(getComputedStyle(lastInfo).marginTop) || 0;
        const galleryTop = root.getBoundingClientRect().top + window.scrollY;
        const availableHeight = Math.max(160, viewportHeight - firstInfo.offsetHeight - firstInfoMargin - (medium.matches ? 32 : 64));
        const maxWidth = Math.min(root.clientWidth, availableHeight * 1104 / 920);
        const fixedWidth = root.clientWidth;
        const cardHeight = (mobile.matches ? fixedWidth : maxWidth) * 920 / 1104;
        const firstHeight = cardHeight + firstInfoMargin + firstInfo.offsetHeight;
        const lastHeight = cardHeight + lastInfoMargin + lastInfo.offsetHeight;
        const mainBottomPadding = main ? parseFloat(getComputedStyle(main).paddingBottom) || 0 : 0;
        const footerHeight = footer?.offsetHeight || 0;
        const peekHeight = Math.min(viewportHeight * 0.3, cardHeight * 0.738 * 0.6);
        const topSpace = medium.matches
            ? viewportHeight - peekHeight - galleryTop
            : (viewportHeight - firstHeight) / 2 - galleryTop;

        root.style.setProperty('--gallery-top-space', `${Math.max(0, topSpace)}px`);
        root.style.setProperty('--gallery-bottom-space', `${Math.max(0, (viewportHeight - lastHeight) / 2 - mainBottomPadding - footerHeight)}px`);

        let nearest = null;
        let distance = Infinity;
        for (const item of items) {
            const bounds = item.querySelector('.home-gallery__media').getBoundingClientRect();
            const delta = Math.abs((bounds.top + bounds.bottom) / 2 - center);
            if (delta < distance) {
                distance = delta;
                nearest = item;
            }
        }

        for (const item of items) {
            const active = item === nearest;
            item.classList.toggle('is-active', active);
            const media = item.querySelector('.home-gallery__media');
            const info = item.querySelector('[data-gallery-info]');

            if (mobile.matches) {
                info.inert = false;
                continue;
            }

            const bounds = media.getBoundingClientRect();
            const fromCenter = Math.abs((bounds.top + bounds.bottom) / 2 - center);
            let progress = Math.max(0, 1 - fromCenter / (viewportHeight * 0.8));
            if (item === items[0] && !medium.matches) {
                progress = Math.max(progress, Math.max(0, 1 - window.scrollY / (viewportHeight * 0.8)));
            }
            if (reducedMotion.matches) progress = active ? 1 : 0;

            item.style.setProperty('--gallery-card-width', `${Math.round(maxWidth * (0.738 + 0.262 * progress))}px`);
            if (progress > 0.8 || (item === items[0] && !medium.matches && window.scrollY === 0)) revealed.add(item);

            // Keep the caption visible until its card has almost left the viewport.
            const exitDistance = viewportHeight * 0.15;
            const visibleDistance = Math.min(bounds.bottom, viewportHeight - bounds.top);
            const enterOpacity = Math.min(1, Math.max(0, (progress - 0.55) / 0.25));
            const exitOpacity = Math.min(1, Math.max(0, (visibleDistance + exitDistance) / exitDistance));
            const infoOpacity = Math.min(revealed.has(item) ? 1 : enterOpacity, exitOpacity);
            item.style.setProperty('--gallery-info-opacity', infoOpacity.toFixed(3));
            info.inert = infoOpacity < 0.1;
        }
    }

    function scheduleUpdate() {
        if (!frame) frame = requestAnimationFrame(update);
    }

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    mobile.addEventListener('change', scheduleUpdate);
    medium.addEventListener('change', scheduleUpdate);
    reducedMotion.addEventListener('change', scheduleUpdate);
    update();

    return () => {
        window.removeEventListener('scroll', scheduleUpdate);
        window.removeEventListener('resize', scheduleUpdate);
        mobile.removeEventListener('change', scheduleUpdate);
        medium.removeEventListener('change', scheduleUpdate);
        reducedMotion.removeEventListener('change', scheduleUpdate);
        cancelAnimationFrame(frame);
    };
}
