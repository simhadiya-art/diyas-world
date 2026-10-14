// The Gate's hero: a field of kolam dots that scatter from the cursor (or finger),
// connect into kolam-like loops nearby, and form the lion mark in the middle.
import { FACE, PETAL, PETAL_VEIN, LION_CENTER, petalAngles } from '../lib/lion';

type Dot = { hx: number; hy: number; x: number; y: number; vx: number; vy: number; lion: boolean; col: number; row: number };
type Ripple = { x: number; y: number; r: number; life: number };

export function initHeroField(canvas: HTMLCanvasElement, { reduced = false } = {}) {
  const ctx = canvas.getContext('2d')!;
  let w = 0, h = 0, dpr = 1, spacing = 28;
  let dots: Dot[] = [];
  let grid: (Dot | undefined)[][] = [];
  let lionPaths: Path2D[] = [];
  let lionBox = { x: 0, y: 0, size: 0 };
  const pointer = { x: -9999, y: -9999, active: false };
  const ripples: Ripple[] = [];
  let colors = readColors();
  let running = false;
  let visible = true;
  let t = 0;
  let lionReveal = 1; // lion strokes opacity multiplier

  function readColors() {
    const s = getComputedStyle(document.documentElement);
    return {
      ink: s.getPropertyValue('--ink').trim() || '#1f1420',
      muted: s.getPropertyValue('--muted').trim() || '#6b5a60',
      magenta: s.getPropertyValue('--magenta').trim() || '#b0175f',
      saffron: s.getPropertyValue('--saffron').trim() || '#f2a900',
      teal: s.getPropertyValue('--teal').trim() || '#0e7c7b',
    };
  }

  function buildLion() {
    const mobile = w < 760;
    const size = mobile ? Math.min(w * 0.86, h * 0.5) : Math.min(h * 0.74, w * 0.4);
    const cx = mobile ? w / 2 : w * 0.75;
    const cy = mobile ? h * 0.3 : h * 0.5;
    lionBox = { x: cx - size / 2, y: cy - size / 2, size };

    const k = size / 100;
    const m = new DOMMatrix().translate(lionBox.x, lionBox.y).scale(k);
    const raw: Path2D[] = [];
    for (const a of petalAngles) {
      const rot = new DOMMatrix().translate(LION_CENTER.x, LION_CENTER.y).rotate(a).translate(-LION_CENTER.x, -LION_CENTER.y);
      for (const d of [PETAL, PETAL_VEIN]) {
        const p = new Path2D();
        p.addPath(new Path2D(d), rot);
        raw.push(p);
      }
    }
    FACE.forEach((d) => raw.push(new Path2D(d)));
    lionPaths = raw.map((p) => {
      const out = new Path2D();
      out.addPath(p, m);
      return out;
    });

    // Sample which grid dots sit on the lion's lines.
    const off = document.createElement('canvas');
    off.width = Math.ceil(w);
    off.height = Math.ceil(h);
    const o = off.getContext('2d', { willReadFrequently: true })!;
    o.lineWidth = Math.max(spacing * 0.42, 2.4 * k);
    o.lineCap = 'round';
    o.strokeStyle = '#000';
    lionPaths.forEach((p) => o.stroke(p));
    const data = o.getImageData(0, 0, off.width, off.height).data;
    for (const d of dots) {
      const px = Math.round(d.hx), py = Math.round(d.hy);
      if (px < 0 || py < 0 || px >= off.width || py >= off.height) continue;
      d.lion = data[(py * off.width + px) * 4 + 3] > 40;
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return; // not laid out yet
    w = rect.width;
    h = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    spacing = Math.max(20, Math.min(32, w / 42));

    dots = [];
    grid = [];
    const cols = Math.ceil(w / spacing) + 1;
    const rows = Math.ceil(h / spacing) + 1;
    const ox = (w - (cols - 1) * spacing) / 2;
    const oy = (h - (rows - 1) * spacing) / 2;
    for (let r = 0; r < rows; r++) {
      grid[r] = [];
      for (let c = 0; c < cols; c++) {
        const hx = ox + c * spacing;
        const hy = oy + r * spacing;
        const d: Dot = { hx, hy, x: hx, y: hy, vx: 0, vy: 0, lion: false, col: c, row: r };
        dots.push(d);
        grid[r][c] = d;
      }
    }
    buildLion();
    draw();
  }

  function step() {
    t += 1;
    const R = Math.max(110, spacing * 5);
    for (const rp of ripples) {
      rp.r += 9;
      rp.life -= 0.022;
    }
    while (ripples.length && ripples[0].life <= 0) ripples.shift();

    for (const d of dots) {
      // ambient breathing so the field feels alive
      const wave = Math.sin(t * 0.02 + d.hx * 0.012 + d.hy * 0.008) * 1.4;
      let fx = (d.hx - d.x) * 0.075;
      let fy = (d.hy + wave - d.y) * 0.075;
      if (pointer.active) {
        const dx = d.x - pointer.x, dy = d.y - pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist < R && dist > 0.01) {
          const f = (1 - dist / R) ** 2 * 9;
          fx += (dx / dist) * f;
          fy += (dy / dist) * f;
        }
      }
      for (const rp of ripples) {
        const dx = d.x - rp.x, dy = d.y - rp.y;
        const dist = Math.hypot(dx, dy) || 1;
        const band = Math.abs(dist - rp.r);
        if (band < 40) {
          const f = (1 - band / 40) * 6 * rp.life;
          fx += (dx / dist) * f;
          fy += (dy / dist) * f;
        }
      }
      d.vx = (d.vx + fx) * 0.8;
      d.vy = (d.vy + fy) * 0.8;
      d.x += d.vx;
      d.y += d.vy;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const R = Math.max(110, spacing * 5);

    // faint lion line art underneath
    ctx.save();
    ctx.globalAlpha = 0.5 * lionReveal;
    ctx.strokeStyle = colors.magenta;
    ctx.lineWidth = Math.max(1.4, lionBox.size / 200);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    lionPaths.forEach((p) => ctx.stroke(p));
    ctx.restore();

    // kolam loops near the pointer: curves between neighbouring dots
    if (pointer.active) {
      ctx.save();
      ctx.strokeStyle = colors.saffron;
      ctx.lineWidth = 1.4;
      for (const d of dots) {
        const dist = Math.hypot(d.x - pointer.x, d.y - pointer.y);
        if (dist > R * 1.1) continue;
        ctx.globalAlpha = Math.max(0, 1 - dist / (R * 1.1)) * 0.85;
        const right = grid[d.row]?.[d.col + 1];
        const down = grid[d.row + 1]?.[d.col];
        const bend = (d.col + d.row) % 2 ? 1 : -1;
        ctx.beginPath();
        if (right) {
          ctx.moveTo(d.x, d.y);
          ctx.quadraticCurveTo((d.x + right.x) / 2, (d.y + right.y) / 2 + bend * spacing * 0.45, right.x, right.y);
        }
        if (down) {
          ctx.moveTo(d.x, d.y);
          ctx.quadraticCurveTo((d.x + down.x) / 2 + bend * spacing * 0.45, (d.y + down.y) / 2, down.x, down.y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    // the dots
    for (const d of dots) {
      const disp = Math.min(1, Math.hypot(d.x - d.hx, d.y - d.hy) / 18);
      if (d.lion) {
        ctx.globalAlpha = 0.35 + 0.65 * lionReveal;
        ctx.fillStyle = disp > 0.3 ? colors.saffron : colors.magenta;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 2.6 + disp * 1.4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.globalAlpha = 0.28 + disp * 0.6;
        ctx.fillStyle = disp > 0.3 ? colors.teal : colors.muted;
        ctx.beginPath();
        ctx.arc(d.x, d.y, 1.5 + disp * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function loop() {
    if (!running) return;
    step();
    draw();
    requestAnimationFrame(loop);
  }
  function start() {
    if (running || reduced || !visible || document.hidden) return;
    running = true;
    requestAnimationFrame(loop);
  }
  function stop() {
    running = false;
  }

  // ---- input ----
  const toLocal = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const target = canvas.parentElement!;
  target.addEventListener('pointermove', (e) => {
    const p = toLocal(e);
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.active = true;
  });
  target.addEventListener('pointerleave', () => (pointer.active = false));
  target.addEventListener('pointerdown', (e) => {
    const p = toLocal(e);
    ripples.push({ x: p.x, y: p.y, r: 0, life: 1 });
    if (e.pointerType !== 'mouse') {
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.active = true;
    }
  });
  target.addEventListener('pointerup', (e) => {
    if (e.pointerType !== 'mouse') pointer.active = false;
  });

  // ---- lifecycle ----
  new ResizeObserver(() => resize()).observe(canvas);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    visible ? start() : stop();
  }).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  window.addEventListener('themechange', () => {
    requestAnimationFrame(() => {
      colors = readColors();
      draw();
    });
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    colors = readColors();
    draw();
  });

  resize();
  start();

  return {
    /** Send a ripple from a point (used by the intro). */
    ripple(x = w / 2, y = h / 2) {
      ripples.push({ x, y, r: 0, life: 1 });
    },
  };
}
