// Shared motion helpers. Everything respects prefers-reduced-motion.
import { animate, stagger } from 'animejs';

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Fade/slide in anything marked data-reveal as it scrolls into view. */
export function initReveal() {
  const items = document.querySelectorAll<HTMLElement>('[data-reveal]');
  (window as any).__revealReady = true;
  if (reducedMotion() || !('IntersectionObserver' in window)) {
    items.forEach((el) => (el.style.opacity = '1'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        io.unobserve(el);
        const kids = el.hasAttribute('data-reveal-stagger') ? Array.from(el.children) : null;
        if (kids) {
          el.style.opacity = '1';
          animate(kids, {
            opacity: [0, 1],
            translateY: [40, 0],
            rotate: [stagger([-3, 3]), 0],
            duration: 700,
            delay: stagger(70),
            ease: 'outElastic(1, .75)',
          });
        } else {
          animate(el, { opacity: [0, 1], translateY: [30, 0], duration: 650, ease: 'out(4)' });
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );
  items.forEach((el) => io.observe(el));
}
