import { gsap } from 'gsap';

/**
 * Trigger an advanced Trailing Lines & Particle Comet Add-to-Cart Animation.
 * 
 * @param {Object} options
 * @param {number} [options.startX] - Starting X coordinate (or computed from fromElement)
 * @param {number} [options.startY] - Starting Y coordinate (or computed from fromElement)
 * @param {HTMLElement} [options.fromElement] - Origin element (button, icon)
 * @param {string} [options.imageUrl] - Product thumbnail URL
 * @param {'add'|'subtract'} [options.type='add'] - Operation type
 * @param {number} [options.count=1] - Quantity delta
 */
export function triggerCartAnimation({
  startX,
  startY,
  fromElement,
  imageUrl,
  type = 'add',
  count = 1
} = {}) {
  if (typeof window === 'undefined') return;

  // 1. Resolve start coordinates
  let originX = startX;
  let originY = startY;

  if ((originX === undefined || originY === undefined) && fromElement) {
    const rect = fromElement.getBoundingClientRect();
    originX = rect.left + rect.width / 2;
    originY = rect.top + rect.height / 2;
  }

  if (originX === undefined || originY === undefined) {
    originX = window.innerWidth / 2;
    originY = window.innerHeight / 2;
  }

  // 2. Resolve destination cart element
  const desktopCart = document.getElementById('cart-btn-desktop');
  const mobileCart = document.getElementById('cart-btn-mobile');
  const targetEl = (window.innerWidth < 768 && mobileCart) ? mobileCart : (desktopCart || mobileCart);

  if (!targetEl) return;

  const targetRect = targetEl.getBoundingClientRect();
  const destX = targetRect.left + targetRect.width / 2;
  const destY = targetRect.top + targetRect.height / 2;

  // Invert trajectory if subtracting
  const [x0, y0] = type === 'subtract' ? [destX, destY] : [originX, originY];
  const [x1, y1] = type === 'subtract' ? [originX, originY] : [destX, destY];

  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);

  // 3. Create SVG Container for Trailing Line Canvas
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'fixed inset-0 w-full h-full pointer-events-none z-[99999]');
  svg.style.position = 'fixed';
  svg.style.top = '0';
  svg.style.left = '0';
  svg.style.width = '100vw';
  svg.style.height = '100vh';

  // Define Gradients & Filters
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const gradId = `cart-trail-grad-${Math.random().toString(36).slice(2, 9)}`;
  const filterId = `cart-glow-${Math.random().toString(36).slice(2, 9)}`;

  defs.innerHTML = `
    <linearGradient id="${gradId}" gradientUnits="userSpaceOnUse" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}">
      <stop offset="0%" stop-color="${type === 'subtract' ? '#EF4444' : '#EC268F'}" stop-opacity="1" />
      <stop offset="60%" stop-color="${type === 'subtract' ? '#F59E0B' : '#E5C158'}" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#5D3E85" stop-opacity="0.1" />
    </linearGradient>
    <filter id="${filterId}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3.5" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  `;
  svg.appendChild(defs);

  // Compute Quadratic Bezier Control Point with artistic arc
  const midX = (x0 + x1) / 2;
  const midY = (y0 + y1) / 2;
  // Arc curvature height perpendicular to chord
  const curveOffset = Math.min(180, Math.max(60, dist * 0.25));
  const cx = midX - (dy / dist) * curveOffset;
  const cy = midY + (dx / dist) * curveOffset - 40;

  const pathD = `M ${x0} ${y0} Q ${cx} ${cy} ${x1} ${y1}`;

  // Glowing Background Line Path
  const glowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  glowPath.setAttribute('d', pathD);
  glowPath.setAttribute('fill', 'none');
  glowPath.setAttribute('stroke', `url(#${gradId})`);
  glowPath.setAttribute('stroke-width', '6');
  glowPath.setAttribute('filter', `url(#${filterId})`);
  glowPath.setAttribute('stroke-linecap', 'round');
  glowPath.setAttribute('opacity', '0.7');

  // Crisp Core Line Path
  const corePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  corePath.setAttribute('d', pathD);
  corePath.setAttribute('fill', 'none');
  corePath.setAttribute('stroke', '#FFFFFF');
  corePath.setAttribute('stroke-width', '2');
  corePath.setAttribute('stroke-linecap', 'round');
  corePath.setAttribute('opacity', '0.9');

  svg.appendChild(glowPath);
  svg.appendChild(corePath);
  document.body.appendChild(svg);

  const pathLength = glowPath.getTotalLength();
  glowPath.style.strokeDasharray = `${pathLength} ${pathLength}`;
  glowPath.style.strokeDashoffset = `${pathLength}`;
  corePath.style.strokeDasharray = `${pathLength} ${pathLength}`;
  corePath.style.strokeDashoffset = `${pathLength}`;

  // 4. Create Main Floating Comet Orb
  const orb = document.createElement('div');
  orb.className = 'fixed pointer-events-none z-[100000] flex items-center justify-center';
  orb.style.left = '0px';
  orb.style.top = '0px';
  orb.style.width = '38px';
  orb.style.height = '38px';
  orb.style.borderRadius = '999px';
  orb.style.backgroundColor = type === 'subtract' ? '#EF4444' : '#17101F';
  orb.style.border = `2.5px solid ${type === 'subtract' ? '#FCA5A5' : '#EC268F'}`;
  orb.style.boxShadow = `0 0 24px ${type === 'subtract' ? 'rgba(239,68,68,0.7)' : 'rgba(236,38,143,0.75)'}`;
  orb.style.transform = `translate(${x0 - 19}px, ${y0 - 19}px) scale(0.6)`;
  orb.style.overflow = 'hidden';

  if (imageUrl && type === 'add') {
    const img = document.createElement('img');
    img.src = imageUrl;
    img.className = 'w-full h-full object-cover';
    orb.appendChild(img);
  } else {
    orb.innerHTML = type === 'subtract' 
      ? '<span style="color:#fff;font-weight:900;font-size:16px;line-height:1">−1</span>' 
      : '<span style="color:#fff;font-weight:900;font-size:15px;line-height:1">+1</span>';
  }

  document.body.appendChild(orb);

  // 5. Setup GSAP Timeline for Trajectory & Particle Trail
  const tl = gsap.timeline({
    onComplete: () => {
      // Clean up SVG & Orb
      svg.remove();
      orb.remove();

      // Trigger Cart Impact & Spring Bounce
      const impactTarget = type === 'subtract' ? (fromElement || targetEl) : targetEl;
      if (impactTarget) {
        gsap.timeline()
          .to(impactTarget, { scale: 1.25, duration: 0.16, ease: 'back.out(2)' })
          .to(impactTarget, { scale: 0.94, duration: 0.14, ease: 'power2.inOut' })
          .to(impactTarget, { scale: 1.08, duration: 0.12, ease: 'power2.out' })
          .to(impactTarget, { scale: 1.0, duration: 0.16, ease: 'elastic.out(1, 0.4)' });

        // Trigger Shockwave Halo
        const halo = document.createElement('div');
        halo.className = 'fixed pointer-events-none z-[99998] rounded-full border-2';
        const targetRectNow = impactTarget.getBoundingClientRect();
        halo.style.borderColor = type === 'subtract' ? '#EF4444' : '#EC268F';
        halo.style.left = `${targetRectNow.left + targetRectNow.width / 2 - 20}px`;
        halo.style.top = `${targetRectNow.top + targetRectNow.height / 2 - 20}px`;
        halo.style.width = '40px';
        halo.style.height = '40px';
        document.body.appendChild(halo);

        gsap.to(halo, {
          scale: 2.4,
          opacity: 0,
          duration: 0.6,
          ease: 'power2.out',
          onComplete: () => halo.remove()
        });
      }
    }
  });

  const duration = Math.min(0.9, Math.max(0.65, dist / 900));

  // Animate the Trail Lines (Drawing + Fade)
  tl.to([glowPath, corePath], {
    strokeDashoffset: 0,
    duration: duration * 0.75,
    ease: 'power2.inOut'
  }, 0);

  tl.to([glowPath, corePath], {
    opacity: 0,
    duration: duration * 0.4,
    ease: 'power1.out'
  }, duration * 0.6);

  // Position Tracker for Bezier Curve
  const progressObj = { t: 0 };
  let lastSparkTime = 0;

  tl.to(progressObj, {
    t: 1,
    duration: duration,
    ease: 'power2.inOut',
    onUpdate: () => {
      const t = progressObj.t;
      // Quadratic Bezier Formula: B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
      const curX = Math.pow(1 - t, 2) * x0 + 2 * (1 - t) * t * cx + Math.pow(t, 2) * x1;
      const curY = Math.pow(1 - t, 2) * y0 + 2 * (1 - t) * t * cy + Math.pow(t, 2) * y1;

      // Scale up at mid-flight, shrink on destination impact
      const scale = t < 0.4 ? 0.6 + t * 1.2 : 1.08 - (t - 0.4) * 0.9;
      orb.style.transform = `translate(${curX - 19}px, ${curY - 19}px) scale(${Math.max(0.2, scale)})`;

      // Spawn Trailing Star Sparks along the path
      const now = performance.now();
      if (now - lastSparkTime > 35 && t > 0.05 && t < 0.95) {
        lastSparkTime = now;
        spawnSpark(curX, curY, type);
      }
    }
  }, 0);
}

/**
 * Spawns a glowing particle spark behind the flying comet
 */
function spawnSpark(x, y, type) {
  const spark = document.createElement('div');
  spark.className = 'fixed pointer-events-none z-[99999] rounded-full';
  const size = Math.random() * 6 + 3;
  const colors = type === 'subtract' 
    ? ['#EF4444', '#F87171', '#FBBF24', '#FFFFFF'] 
    : ['#EC268F', '#E5C158', '#5D3E85', '#FFFFFF', '#F472B6'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  spark.style.left = `${x - size / 2}px`;
  spark.style.top = `${y - size / 2}px`;
  spark.style.width = `${size}px`;
  spark.style.height = `${size}px`;
  spark.style.backgroundColor = color;
  spark.style.boxShadow = `0 0 ${size * 2}px ${color}`;

  document.body.appendChild(spark);

  const angle = Math.random() * Math.PI * 2;
  const velocity = Math.random() * 24 + 6;
  const sparkDx = Math.cos(angle) * velocity;
  const sparkDy = Math.sin(angle) * velocity;

  gsap.to(spark, {
    x: sparkDx,
    y: sparkDy,
    scale: 0.1,
    opacity: 0,
    duration: Math.random() * 0.4 + 0.3,
    ease: 'power2.out',
    onComplete: () => spark.remove()
  });
}
