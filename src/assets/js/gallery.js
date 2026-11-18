export function createGallery(root) {
    if (!root) return () => {};

    const mobile = window.matchMedia('(max-width: 520px)');
    const medium = window.matchMedia('(min-width: 521px) and (max-width: 1080px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const items = [...root.querySelectorAll('[data-gallery-item]')];
    const main = root.closest('.site-layout__content');
    const footer = document.querySelector('.site-footer');
    let frame = 0;

    function setSpace(name, value) {
        const pixels = `${Math.round(Math.max(0, value))}px`;
        if (root.style.getPropertyValue(name) !== pixels) root.style.setProperty(name, pixels);
    }

    function setItemValue(item, property, value) {
        if (item.style.getPropertyValue(property) !== value) item.style.setProperty(property, value);
    }

    function update() {
        frame = 0;
        if (!items.length) return;

        const viewportHeight = window.innerHeight;
        const center = viewportHeight / 2;
        const firstInfo = items[0].querySelector('[data-gallery-info]');
        const lastInfo = items[items.length - 1].querySelector('[data-gallery-info]');
        const firstInfoInner = firstInfo.querySelector('.home-gallery__info-inner');
        const lastInfoInner = lastInfo.querySelector('.home-gallery__info-inner');
        const firstInfoMargin = parseFloat(getComputedStyle(firstInfo).marginTop) || 0;
        const lastInfoMargin = parseFloat(getComputedStyle(lastInfo).marginTop) || 0;
        const galleryTop = root.getBoundingClientRect().top + window.scrollY;
        const verticalInset = mobile.matches ? 32 : Math.min(144, Math.max(64, viewportHeight * 0.1));
        let maxWidth = 0;
        for (let pass = 0; pass < 3; pass++) {
            const infoHeight = firstInfoInner.offsetHeight;
            const availableHeight = Math.max(160, viewportHeight - infoHeight - firstInfoMargin - verticalInset * 2);
            maxWidth = Math.min(root.clientWidth, availableHeight * 1104 / 920);
            const captionWidth = `${Math.round(maxWidth)}px`;
            if (root.style.getPropertyValue('--gallery-caption-width') === captionWidth) break;
            root.style.setProperty('--gallery-caption-width', captionWidth);
            if (firstInfoInner.offsetHeight === infoHeight) break;
        }
        const fixedWidth = root.clientWidth;
        const cardHeight = (mobile.matches ? fixedWidth : maxWidth) * 920 / 1104;
        const firstHeight = cardHeight + firstInfoMargin + firstInfoInner.offsetHeight;
        const lastHeight = cardHeight + lastInfoMargin + lastInfoInner.offsetHeight;
        const mainBottomPadding = main ? parseFloat(getComputedStyle(main).paddingBottom) || 0 : 0;
        const footerHeight = footer?.offsetHeight || 0;
        // The main content already adds 40px above the gallery at medium widths.
        const mediumTopSpace = Math.min(64, Math.max(24, viewportHeight * 0.05));
        const topSpace = medium.matches
            ? mediumTopSpace
            : (viewportHeight - firstHeight) / 2 - galleryTop;

        setSpace('--gallery-top-space', topSpace);
        setSpace('--gallery-bottom-space', (viewportHeight - lastHeight) / 2 - mainBottomPadding - footerHeight);
        root.classList.add('is-ready');

        if (mobile.matches) return;

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
            const infoInner = info.querySelector('.home-gallery__info-inner');

            const bounds = media.getBoundingClientRect();
            const fromCenter = Math.abs((bounds.top + bounds.bottom) / 2 - center);
            let progress = Math.max(0, 1 - fromCenter / (viewportHeight * 0.8));
            if (item === items[0] && !medium.matches) {
                progress = Math.max(progress, Math.max(0, 1 - window.scrollY / (viewportHeight * 0.8)));
            }
            if (reducedMotion.matches) progress = active ? 1 : 0;

            const cardWidth = Math.round(maxWidth * (0.738 + 0.262 * progress));
            const cardScale = maxWidth ? cardWidth / maxWidth : 1;
            // Scale the full-size caption layout with the card to preserve text line breaks.
            setItemValue(item, '--gallery-card-width', `${cardWidth}px`);
            setItemValue(item, '--gallery-card-scale', cardScale.toFixed(4));
            setItemValue(item, '--gallery-info-height', `${Math.ceil(infoInner.offsetHeight * cardScale)}px`);
        }
    }

    function scheduleUpdate() {
        if (!frame) frame = requestAnimationFrame(update);
    }

    function onScroll() {
        if (!mobile.matches) scheduleUpdate();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    mobile.addEventListener('change', scheduleUpdate);
    medium.addEventListener('change', scheduleUpdate);
    reducedMotion.addEventListener('change', scheduleUpdate);
    update();
    document.fonts?.ready.then(() => {
        if (root.isConnected) scheduleUpdate();
    });

    return () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', scheduleUpdate);
        mobile.removeEventListener('change', scheduleUpdate);
        medium.removeEventListener('change', scheduleUpdate);
        reducedMotion.removeEventListener('change', scheduleUpdate);
        cancelAnimationFrame(frame);
    };
}
