// Easter egg: the lion roars. Triggered by clicking any lion mark 5 times.
import { animate, stagger, createTimeline } from 'animejs';
import { reducedMotion } from './motion';

const LINES = ['ROAAAR!', 'Simha means lion.', 'You found the lion.'];
let busy = false;

export function roar(origin: SVGElement) {
  if (busy) return;
  busy = true;

  const bubble = document.createElement('div');
  bubble.className = 'roar-bubble';
  bubble.setAttribute('role', 'status');
  bubble.innerHTML = `<strong>${LINES[0]}</strong><span>${LINES[1]}</span>`;
  const r = origin.getBoundingClientRect();
  bubble.style.left = `${Math.min(r.left, window.innerWidth - 260)}px`;
  bubble.style.top = `${r.bottom + 10}px`;
  document.body.append(bubble);

  const petals = origin.querySelectorAll('.lm-petal');
  const face = origin.querySelector('.lm-face');

  if (reducedMotion()) {
    setTimeout(() => {
      bubble.remove();
      busy = false;
    }, 2200);
    return;
  }

  createTimeline({ onComplete: () => { bubble.remove(); busy = false; } })
    .add(origin, { scale: [1, 1.6], rotate: [0, -8], duration: 180, ease: 'out(3)' })
    .add(petals, { scale: [1, 1.35, 1], duration: 700, delay: stagger(25, { from: 'center' }), ease: 'outElastic(1, .4)' }, '<')
    .add(face!, { translateX: [0, -2, 2, -2, 2, 0], duration: 400, ease: 'linear' }, '<<')
    .add(bubble, { opacity: [0, 1], scale: [0.4, 1], rotate: [-12, -3], duration: 450, ease: 'outElastic(1, .5)' }, '<<')
    .add(origin, { scale: 1, rotate: 0, duration: 600, ease: 'outElastic(1, .5)' }, '+=500')
    .add(bubble, { opacity: 0, translateY: -20, duration: 400, ease: 'in(2)' }, '+=900');
}

/** Count clicks on a lion; five quick clicks = roar. Returns true when it roared. */
export function makeRoarCounter(target: SVGElement) {
  let count = 0;
  let timer: number | undefined;
  return () => {
    count++;
    clearTimeout(timer);
    timer = window.setTimeout(() => (count = 0), 1500);
    if (count >= 5) {
      count = 0;
      roar(target);
      return true;
    }
    return false;
  };
}
