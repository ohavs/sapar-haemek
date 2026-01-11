export const smoothScrollToTop = (duration: number = 1000) => {
    const start = window.scrollY;
    const startTime = 'now' in window.performance ? performance.now() : new Date().getTime();

    const easeInOutQuad = (t: number, b: number, c: number, d: number) => {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    };

    const scroll = () => {
        const now = 'now' in window.performance ? performance.now() : new Date().getTime();

        const timeFunction = easeInOutQuad(now - startTime, start, -start, duration);

        window.scrollTo(0, Math.ceil(timeFunction));

        if (window.scrollY === 0) return;

        if (now - startTime < duration) {
            requestAnimationFrame(scroll);
        }
    };

    requestAnimationFrame(scroll);
};
