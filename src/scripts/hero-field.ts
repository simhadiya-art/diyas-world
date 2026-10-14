// The Gate's hero: a field of dots that scatter from the cursor (or finger),
// a trail of sparkles behind it, and a burst of gems wherever you click.

type Dot = { hx: number; hy: number; x: number; y: number; vx: number; vy: number; col: number; row: number };
type Ripple = { x: number; y: number; r: number; life: number };
/** kind 0 = twinkling four-point star (trail), kind 1 = faceted gem (burst) */
type Spark = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string; rot: number; spin: number; kind: 0 | 1 };

const MAX_SPARKS = 260;

export function initHeroField(canvas: HTMLCanvasElement, { reduced = false } = {}) {
  const ctx = canvas.getContext('2d')!;
  let w = 0, h = 0, dpr = 1, spacing = 28;
  let dots: Dot[] = [];
  let grid: (Dot | undefined)[][] = [];
  const pointer = { x: -9999, y: -9999, active: false };
  const lastSpawn = { x: -9999, y: -9999 };
  const ripples: Ripple[] = [];
  const sparks: Spark[] = [];
  let colors = readColors();
  let running = false;
  let visible = true;
  let t = 0;

  function readColors() {
    const s = getComputedStyle(document.documentElement);
    const v = (name: string, fallback: string) => s.getPropertyValue(name).trim() || fallback;
    const c = {
      muted: v('--muted', '#536775'),
      jewel: v('--magenta', '#315d88'),
      brass: v('--saffron', '#c4a15b'),
      teal: v('--teal', '#176d6b'),
      ruby: v('--ruby', '#c2416b'),
    };
    return { ...c, gems: [c.brass, c.ruby, c.jewel, c.teal, c.brass] };
  }
  const pick = () => colors.gems[(Math.random() * colors.gems.length) | 0];

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
        const d: Dot = { hx, hy, x: hx, y: hy, vx: 0, vy: 0, col: c, row: r };
        dots.push(d);
        grid[r][c] = d;
      }
    }
    draw();
  }

  function spawnTrail(x: number, y: number) {
    if (sparks.length >= MAX_SPARKS) return;
    const max = 30 + Math.random() * 22;
    sparks.push({
      x: x + (Math.random() - 0.5) * 14,
      y: y + (Math.random() - 0.5) * 14,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.6 + 0.25,
      life: max,
      max,
      size: 3 + Math.random() * 5,
      color: pick(),
      rot: 0,
      spin: 0,
      kind: 0,
    });
  }

  function burst(x: number, y: number, n = 28) {
    for (let i = 0; i < n && sparks.length < MAX_SPARKS; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 7;
      const max = 55 + Math.random() * 40;
      const gem = Math.random() > 0.35;
      sparks.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 3,
        life: max,
        max,
        size: gem ? 4 + Math.random() * 5 : 4 + Math.random() * 6,
        color: pick(),
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.3,
        kind: gem ? 1 : 0,
      });
    }
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

    for (const s of sparks) {
      if (s.kind === 1) {
        s.vy += 0.22;
        s.vx *= 0.985;
      } else {
        s.vx *= 0.96;
        s.vy = s.vy * 0.96 + 0.015;
      }
      s.x += s.vx;
      s.y += s.vy;
      s.rot += s.spin;
      s.life -= 1;
    }
    for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].life <= 0 || sparks[i].y > h + 40) sparks.splice(i, 1);
  }

  function drawStar(s: Spark) {
    const k = s.life / s.max;
    const r = s.size * Math.sin(k * Math.PI); // grow then shrink: a twinkle
    const i = r * 0.22;
    ctx.globalAlpha = Math.min(1, k * 2);
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y - r);
    ctx.lineTo(s.x + i, s.y - i);
    ctx.lineTo(s.x + r, s.y);
    ctx.lineTo(s.x + i, s.y + i);
    ctx.lineTo(s.x, s.y + r);
    ctx.lineTo(s.x - i, s.y + i);
    ctx.lineTo(s.x - r, s.y);
    ctx.lineTo(s.x - i, s.y - i);
    ctx.closePath();
    ctx.fill();
  }

  function drawGem(s: Spark) {
    const r = s.size;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);
    ctx.globalAlpha = Math.min(1, s.life / 20);
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.7, -r * 0.2);
    ctx.lineTo(0, r * 1.1);
    ctx.lineTo(-r * 0.7, -r * 0.2);
    ctx.closePath();
    ctx.fill();
    // lighter facet so it catches the light
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.7, -r * 0.2);
    ctx.lineTo(0, r * 1.1);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const R = Math.max(110, spacing * 5);

    // kolam loops near the pointer: curves between neighbouring dots
    if (pointer.active) {
      ctx.save();
      ctx.strokeStyle = colors.brass;
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
          ctx.lineTo((d.x + right.x) / 2, (d.y + right.y) / 2 + bend * spacing * 0.28);
          ctx.lineTo(right.x, right.y);
        }
        if (down) {
          ctx.moveTo(d.x, d.y);
          ctx.lineTo((d.x + down.x) / 2 + bend * spacing * 0.28, (d.y + down.y) / 2);
          ctx.lineTo(down.x, down.y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    // the dots: displaced ones light up in jewel tones
    for (const d of dots) {
      const disp = Math.min(1, Math.hypot(d.x - d.hx, d.y - d.hy) / 18);
      ctx.globalAlpha = 0.28 + disp * 0.65;
      ctx.fillStyle = disp > 0.3 ? colors.gems[(d.col + d.row * 3) % colors.gems.length] : colors.muted;
      ctx.beginPath();
      ctx.arc(d.x, d.y, 1.5 + disp * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const s of sparks) (s.kind === 1 ? drawGem : drawStar)(s);
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
    if (Math.hypot(p.x - lastSpawn.x, p.y - lastSpawn.y) > 18) {
      spawnTrail(p.x, p.y);
      lastSpawn.x = p.x;
      lastSpawn.y = p.y;
    }
  });
  target.addEventListener('pointerleave', () => (pointer.active = false));
  target.addEventListener('pointerdown', (e) => {
    const p = toLocal(e);
    ripples.push({ x: p.x, y: p.y, r: 0, life: 1 });
    burst(p.x, p.y);
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
    /** Throw a handful of gems from a point (canvas coordinates). */
    burst(x: number, y: number, n?: number) {
      if (!reduced) burst(x, y, n);
    },
  };
}
