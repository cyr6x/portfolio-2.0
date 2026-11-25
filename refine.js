(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const portrait = document.querySelector('#portrait-stage');

  if (portrait) {
    portrait.addEventListener('pointerenter', () => {
      if (!reduced) portrait.classList.add('is-alive');
    });

    portrait.addEventListener('pointermove', event => {
      if (reduced) return;
      const rect = portrait.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      portrait.style.setProperty('--portrait-pan-x', (nx * 8) + 'px');
      portrait.style.setProperty('--portrait-pan-y', (ny * 6) + 'px');
    });

    portrait.addEventListener('pointerleave', () => {
      portrait.classList.remove('is-alive');
      portrait.style.setProperty('--portrait-pan-x', '0px');
      portrait.style.setProperty('--portrait-pan-y', '0px');
    });
  }

  const contacts = {
    email: {
      values: ['baayacyril@gmail.com', 'baayacyril@outlook.com'],
      href: 'mailto:baayacyril@gmail.com',
      openLabel: 'Click again to open primary email'
    },
    phone: {
      values: ['+256 706 222 076', '+254 795 794 573'],
      href: 'tel:+256706222076',
      openLabel: 'Click again to call primary number'
    }
  };

  document.querySelectorAll('.contact-reveal').forEach(button => {
    button.addEventListener('click', () => {
      const item = contacts[button.dataset.contact];
      if (!item) return;

      const value = button.querySelector('.contact-value');
      const revealed = button.getAttribute('aria-expanded') === 'true';

      if (!revealed) {
        button.setAttribute('aria-expanded', 'true');
        button.classList.add('is-revealed');
        if (value) {
          value.textContent = '';
          const stack = document.createElement('span');
          stack.className = 'contact-value-stack';
          item.values.forEach(entry => {
            const line = document.createElement('span');
            line.textContent = entry;
            stack.appendChild(line);
          });
          value.appendChild(stack);
        }
        button.title = item.openLabel;
        return;
      }

      window.location.href = item.href;
    });
  });

  const projectsLink = document.querySelector('#nav-links a[href="#work"]');
  const projectSections = ['work', 'investigations', 'archive']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  let navFrame = 0;
  function refineNavState() {
    navFrame = 0;
    if (!projectsLink || !projectSections.length) return;

    const inProjects = projectSections.some(section => {
      const rect = section.getBoundingClientRect();
      return rect.top <= innerHeight * 0.48 && rect.bottom >= innerHeight * 0.35;
    });

    if (inProjects) {
      document.querySelectorAll('#nav-links a').forEach(link => link.classList.remove('active'));
      projectsLink.classList.add('active');
    }
  }

  addEventListener('scroll', () => {
    if (!navFrame) navFrame = requestAnimationFrame(refineNavState);
  }, {passive:true});
  addEventListener('resize', () => {
    if (!navFrame) navFrame = requestAnimationFrame(refineNavState);
  }, {passive:true});
  refineNavState();

  const canvas = document.querySelector('#contact-galaxy');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', {alpha:true});
  if (!ctx) return;

  let width = 1;
  let height = 1;
  let ratio = 1;
  let stars = [];
  let spherePoints = [];
  let frame = 0;
  let running = false;
  let mouseX = 0;
  let mouseY = 0;

  function makeSphere(count) {
    const pts = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / Math.max(1, count - 1)) * 2;
      const radius = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      pts.push({
        x: Math.cos(theta) * radius,
        y,
        z: Math.sin(theta) * radius,
        hot: i % 31 === 0
      });
    }
    return pts;
  }

  function size() {
    const rect = canvas.getBoundingClientRect();
    ratio = Math.min(devicePixelRatio || 1, 2);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const starCount = Math.max(80, Math.min(220, Math.floor(width * height / 6500)));
    stars = Array.from({length:starCount}, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: i % 23 === 0 ? 1.5 : Math.random() * 0.8 + 0.25,
      a: Math.random() * 0.46 + 0.08,
      p: Math.random() * Math.PI * 2
    }));
    spherePoints = makeSphere(Math.max(190, Math.min(390, Math.floor(width / 3))));
  }

  function drawContactGalaxy(time = 0) {
    ctx.clearRect(0, 0, width, height);

    stars.forEach(star => {
      const pulse = reduced ? 1 : 0.72 + Math.sin(time * 0.00055 + star.p) * 0.28;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(210,220,232,' + (star.a * pulse) + ')';
      ctx.fill();
    });

    const cx = width * 0.5 + mouseX * 12;
    const cy = height * 0.47 + mouseY * 8;
    const radius = Math.min(width, height) * (width < 700 ? 0.34 : 0.31);
    const rot = reduced ? 0.45 : time * 0.00007;

    const glow = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius * 1.28);
    glow.addColorStop(0, 'rgba(' + ACCENT + ',.06)');
    glow.addColorStop(0.58, 'rgba(' + ACCENT + ',.018)');
    glow.addColorStop(1, 'rgba(' + ACCENT + ',0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.18);

    for (let ring = 0; ring < 3; ring++) {
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * (1.05 + ring * 0.2), radius * (0.28 + ring * 0.055), 0, 0, Math.PI * 2);
      ctx.strokeStyle = ring === 0 ? 'rgba(' + ACCENT + ',.17)' : 'rgba(211,219,230,.08)';
      ctx.lineWidth = ring === 0 ? 1.1 : 0.7;
      ctx.setLineDash(ring === 1 ? [5, 12] : []);
      ctx.stroke();
    }
    ctx.restore();
    ctx.setLineDash([]);

    spherePoints.forEach((point, index) => {
      const cos = Math.cos(rot);
      const sin = Math.sin(rot);
      const rx = point.x * cos - point.z * sin;
      const rz = point.x * sin + point.z * cos;
      const perspective = 0.66 + (rz + 1) * 0.17;
      const x = cx + rx * radius * perspective;
      const y = cy + point.y * radius * 0.92 * perspective;
      const alpha = 0.13 + (rz + 1) * 0.16;
      const dot = point.hot ? 1.8 : 0.55 + (rz + 1) * 0.34;

      ctx.beginPath();
      ctx.arc(x, y, dot, 0, Math.PI * 2);
      ctx.fillStyle = point.hot
        ? 'rgba(' + ACCENT + ',' + Math.min(0.8, alpha + 0.35) + ')'
        : 'rgba(218,226,236,' + alpha + ')';
      ctx.fill();

      if (index % 47 === 0 && rz > -0.15) {
        ctx.beginPath();
        ctx.arc(x, y, 5.5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(' + ACCENT + ',.13)';
        ctx.stroke();
      }
    });

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(225,232,240,.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (running) frame = requestAnimationFrame(drawContactGalaxy);
  }

  canvas.addEventListener('pointermove', event => {
    if (reduced) return;
    const rect = canvas.getBoundingClientRect();
    mouseX = ((event.clientX - rect.left) / rect.width - 0.5);
    mouseY = ((event.clientY - rect.top) / rect.height - 0.5);
  }, {passive:true});

  canvas.addEventListener('pointerleave', () => {
    mouseX = 0;
    mouseY = 0;
  });

  // Animate only while on screen, in a visible tab, in dark theme (the canvas is hidden in light).
  let onScreen = false;
  const syncContactGalaxy = () => {
    const next = !reduced && onScreen && !document.hidden && document.documentElement.dataset.theme !== 'light';
    if (next && !running) {
      running = true;
      frame = requestAnimationFrame(drawContactGalaxy);
    } else if (!next && running) {
      running = false;
      cancelAnimationFrame(frame);
    }
  };
  new IntersectionObserver(entries => {
    onScreen = entries.some(entry => entry.isIntersecting);
    syncContactGalaxy();
  }, {threshold:0.05}).observe(canvas);
  document.addEventListener('visibilitychange', syncContactGalaxy);
  addEventListener('cosmic-theme-change', syncContactGalaxy);

  size();
  drawContactGalaxy(0);

  addEventListener('resize', () => {
    size();
    if (!running) drawContactGalaxy(0);
  }, {passive:true});
})();

/* Cosmic interaction controller: theme, living starfield, neural gravity and magnetic controls. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const rootLoader = document.querySelector('#root-loader');
  const rootLoaderSkip = document.querySelector('#root-loader-skip');
  const rootLoaderState = document.querySelector('#root-loader-state');
  const rootLoaderPercent = document.querySelector('#root-loader-percent');

  function finishRootBoot() {
    if (!rootLoader || rootLoader.classList.contains('is-leaving')) return;
    rootLoader.classList.add('is-leaving');
    root.classList.remove('root-booting');
    try { sessionStorage.setItem('portfolio-root-booted','1'); } catch (_) {}
    setTimeout(() => { root.dataset.booted = 'true'; }, 460);
  }

  let alreadyBooted = false;
  try { alreadyBooted = sessionStorage.getItem('portfolio-root-booted') === '1'; } catch (_) {}
  if (alreadyBooted || reduced) {
    root.dataset.booted = 'true';
  } else if (rootLoader) {
    root.classList.add('root-booting');
    const bootStates = ['acquiring event horizon','mapping identity signature','authorising /root','opening portfolio orbit'];
    const started = performance.now();
    const duration = 1150;
    const tickBoot = now => {
      const p = Math.min(1,(now-started)/duration);
      const eased = 1 - Math.pow(1-p,3);
      const percent = Math.round(eased*100);
      rootLoader.style.setProperty('--boot-progress', String(eased));
      if (rootLoaderPercent) rootLoaderPercent.textContent = percent + '%';
      if (rootLoaderState) rootLoaderState.textContent = bootStates[Math.min(bootStates.length-1,Math.floor(eased*bootStates.length))];
      if (p < 1) requestAnimationFrame(tickBoot);
      else setTimeout(finishRootBoot,180);
    };
    requestAnimationFrame(tickBoot);
    rootLoaderSkip?.addEventListener('click', finishRootBoot);
    // Not {once:true}: that consumed the listener on the first key of any kind (Tab, Shift…),
    // leaving Enter/Escape dead for keyboard users.
    const onBootKey = event => {
      if (event.key !== 'Enter' && event.key !== 'Escape') return;
      removeEventListener('keydown', onBootKey);
      finishRootBoot();
    };
    addEventListener('keydown', onBootKey);
  }

  const themeToggle = document.querySelector('#theme-toggle');
  const themeLabel = themeToggle && themeToggle.querySelector('.theme-label');

  function setTheme(theme, persist = false) {
    const next = theme === 'light' ? 'light' : 'dark';
    if (persist) {
      root.classList.add('theme-switching');
      setTimeout(() => root.classList.remove('theme-switching'), 700);
    }
    root.dataset.theme = next;
    root.style.colorScheme = next;
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', next === 'light' ? '#edf3f7' : '#050608');
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', String(next === 'light'));
      themeToggle.setAttribute('aria-label', next === 'light' ? 'Switch to dark cosmos' : 'Switch to light cosmos');
    }
    if (themeLabel) themeLabel.textContent = next === 'light' ? 'LIGHT' : 'DARK';
    if (persist) {
      try { localStorage.setItem('cosmic-theme', next); } catch (_) {}
    }
    dispatchEvent(new CustomEvent('cosmic-theme-change', {detail:{theme:next}}));
  }

  const systemTheme = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  let storedTheme = systemTheme;
  try { storedTheme = localStorage.getItem('cosmic-theme') || systemTheme; } catch (_) {}
  setTheme(storedTheme);
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      setTheme(root.dataset.theme === 'light' ? 'dark' : 'light', true);
    });
  }

  /* Living cosmic wallpaper. Dark mode carries the cinematic layer; stars gather into the contact gravity well. */
  const cosmos = document.querySelector('#cosmos');
  if (cosmos) {
    const ctx = cosmos.getContext('2d', {alpha:true});
    if (ctx) {
      let w = 1, h = 1, dpr = 1, frame = 0, last = 0, running = !reduced;
      let stars = [], motes = [], scrollWarp = 0, journeyProgress = 0;
      const contactSection = document.querySelector('#contact');
      const contactCore = document.querySelector('.contact-title');
      const clamp01 = value => Math.max(0, Math.min(1, value));

      const makeField = () => {
        const density = Math.max(130, Math.min(260, Math.floor((w * h) / 6500)));
        stars = Array.from({length:density}, (_, i) => ({
          x: Math.random() * w,
          y: Math.random() * h,
          z: Math.random() * .9 + .1,
          r: i % 37 === 0 ? 1.65 : Math.random() * .82 + .18,
          p: Math.random() * Math.PI * 2,
          vx:(Math.random() - .5) * .026,
          vy:(Math.random() - .5) * .018,
          orbit:Math.random() * 300 + 105,
          squash:Math.random() * .28 + .34,
          orbitSpeed:(Math.random() * .000018 + .000018) * (i % 2 ? 1 : -1)
        }));
        motes = Array.from({length:34}, () => ({
          x:Math.random() * w,
          y:Math.random() * h,
          p:Math.random() * Math.PI * 2,
          r:Math.random() * 115 + 65
        }));
      };

      const resizeCosmos = () => {
        dpr = Math.min(devicePixelRatio || 1, 1.6);
        w = Math.max(1, innerWidth);
        h = Math.max(1, innerHeight);
        cosmos.width = Math.floor(w * dpr);
        cosmos.height = Math.floor(h * dpr);
        cosmos.style.width = w + 'px';
        cosmos.style.height = h + 'px';
        ctx.setTransform(dpr,0,0,dpr,0,0);
        makeField();
      };

      // Quieter blue-greys for mid-page scenes; the token accent for hero, projects and contact.
      const sceneAccents = {
        investigations:'92,120,154',
        archive:'78,111,145',
        arsenal:'78,116,139',
        roadmap:'91,113,139'
      };
      const palette = () => {
        const scene = document.body.dataset.scene || 'identity';
        const accent = sceneAccents[scene] || ACCENT;
        return {star:'223,232,242', faint:'104,133,168', accent, nebula:'42,69,108'};
      };

      const contactPull = () => {
        if (!contactSection) return clamp01((journeyProgress - .58) / .38);
        const rect = contactSection.getBoundingClientRect();
        const proximity = clamp01((h * 1.75 - rect.top) / (h * 1.75));
        const journey = clamp01((journeyProgress - .52) / .44);
        return Math.max(proximity * .92, journey * .78);
      };

      const contactSink = () => {
        if (!contactCore) return {x:w * .5, y:h * 1.12};
        const rect = contactCore.getBoundingClientRect();
        const rawX = rect.left + rect.width * .5;
        const rawY = rect.top + rect.height * .5;
        return {
          x:Math.max(w * .18, Math.min(w * .82, rawX)),
          y:Math.max(h * .46, Math.min(h * 1.14, rawY))
        };
      };

      const drawComet = (time, offset, direction) => {
        const cycle = ((time * .000035 + offset) % 1);
        if (cycle > .18) return;
        const p = cycle / .18;
        const x = direction > 0 ? -120 + (w + 240) * p : w + 120 - (w + 240) * p;
        const y = h * (.18 + offset * .53) + Math.sin(p * Math.PI) * 80;
        const len = 95 + 75 * (1 - p);
        const pal = palette();
        const g = ctx.createLinearGradient(x - len * direction, y - len * .22, x, y);
        g.addColorStop(0, 'rgba(' + pal.accent + ',0)');
        g.addColorStop(1, 'rgba(' + pal.accent + ',.34)');
        ctx.strokeStyle = g;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - len * direction, y - len * .22);
        ctx.lineTo(x, y);
        ctx.stroke();
      };

      const cubic = (a,b,c,d,t) => {
        const u = 1-t;
        return u*u*u*a + 3*u*u*t*b + 3*u*t*t*c + t*t*t*d;
      };

      const drawJourneyProbe = pal => {
        if (journeyProgress < .08 || journeyProgress > .88) return;
        const t = clamp01((journeyProgress-.08)/.80);
        const x = cubic(-w*.08,w*.22,w*.78,w*1.08,t);
        const y = cubic(h*.72,h*.12,h*.88,h*.28,t);
        const t2 = Math.max(0,t-.032);
        const tx = cubic(-w*.08,w*.22,w*.78,w*1.08,t2);
        const ty = cubic(h*.72,h*.12,h*.88,h*.28,t2);
        const trail = ctx.createLinearGradient(tx,ty,x,y);
        trail.addColorStop(0,'rgba(' + pal.accent + ',0)');
        trail.addColorStop(1,'rgba(' + pal.accent + ',.52)');
        ctx.strokeStyle = trail;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(tx,ty);
        ctx.lineTo(x,y);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x,y,2.2,0,Math.PI*2);
        ctx.fillStyle = 'rgba(' + pal.accent + ',.9)';
        ctx.shadowBlur = 18;
        ctx.shadowColor = 'rgba(' + pal.accent + ',.7)';
        ctx.fill();
        ctx.shadowBlur = 0;
      };

      const drawCosmos = (time = 0) => {
        if (!reduced && time - last < 32) {
          frame = requestAnimationFrame(drawCosmos);
          return;
        }
        last = time;
        ctx.clearRect(0,0,w,h);

        if (root.dataset.theme === 'light') {
          // Light theme hides this layer: stop scheduling frames until the theme flips back.
          running = false;
          return;
        }

        const pal = palette();
        const breathe = .5 + .5 * Math.sin(time * .00035);
        const gather = contactPull();
        const sink = contactSink();

        const nebulaA = ctx.createRadialGradient(w*.25,h*.32,0,w*.25,h*.32,Math.max(w,h)*.52);
        nebulaA.addColorStop(0,'rgba(' + pal.nebula + ',' + (.045 + breathe*.022) + ')');
        nebulaA.addColorStop(.55,'rgba(' + pal.accent + ',' + (.018 + breathe*.012) + ')');
        nebulaA.addColorStop(1,'rgba(' + pal.accent + ',0)');
        ctx.fillStyle = nebulaA;
        ctx.fillRect(0,0,w,h);

        const nebulaB = ctx.createRadialGradient(w*.78,h*.7,0,w*.78,h*.7,Math.max(w,h)*.46);
        nebulaB.addColorStop(0,'rgba(' + pal.accent + ',' + (.026 + (1-breathe)*.018) + ')');
        nebulaB.addColorStop(1,'rgba(' + pal.accent + ',0)');
        ctx.fillStyle = nebulaB;
        ctx.fillRect(0,0,w,h);

        motes.forEach((m,i) => {
          const drift = reduced ? 0 : Math.sin(time*.00012 + m.p) * 22;
          const g = ctx.createRadialGradient(m.x+drift,m.y,0,m.x+drift,m.y,m.r);
          g.addColorStop(0,'rgba(' + pal.faint + ',' + (i%7===0?.035:.018) + ')');
          g.addColorStop(1,'rgba(' + pal.faint + ',0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(m.x+drift,m.y,m.r,0,Math.PI*2);
          ctx.fill();
        });

        if (gather > .06) {
          const halo = ctx.createRadialGradient(sink.x,sink.y,0,sink.x,sink.y,Math.max(210,Math.min(w,h)*.42));
          halo.addColorStop(0,'rgba(' + pal.accent + ',' + (.035 + gather*.06) + ')');
          halo.addColorStop(.48,'rgba(' + pal.accent + ',' + (gather*.022) + ')');
          halo.addColorStop(1,'rgba(' + pal.accent + ',0)');
          ctx.fillStyle = halo;
          ctx.fillRect(0,0,w,h);
        }

        stars.forEach((s,i) => {
          const px=s.x, py=s.y;
          if (!reduced) {
            s.x += s.vx * (1 + scrollWarp * 4);
            s.y += s.vy * (1 + scrollWarp * 2.5);

            if (gather > .02) {
              const angle = s.p + time * s.orbitSpeed;
              const ring = s.orbit * (.72 + gather * .28);
              const targetX = sink.x + Math.cos(angle) * ring;
              const targetY = sink.y + Math.sin(angle) * ring * s.squash;
              const spring = (.001 + gather * .0048) * (.55 + s.z * .6);
              s.x += (targetX - s.x) * spring;
              s.y += (targetY - s.y) * spring;
            }

            if (gather < .08) {
              if (s.x < -5) s.x = w + 5;
              if (s.x > w + 5) s.x = -5;
              if (s.y < -5) s.y = h + 5;
              if (s.y > h + 5) s.y = -5;
            }
          }

          const twinkle = reduced ? .52 : .38 + Math.sin(time*.0011*s.z + s.p) * .24;
          const alpha = Math.max(.08, twinkle * (.5 + s.z*.55) * (1 + gather*.28));
          const isEnergy = gather > .18 && i % 7 === 0;

          if (isEnergy) {
            ctx.strokeStyle='rgba(' + pal.accent + ',' + (.035 + gather*.11) + ')';
            ctx.lineWidth=.55 + s.z*.35;
            ctx.beginPath();
            ctx.moveTo(px,py);
            ctx.lineTo(s.x,s.y);
            ctx.stroke();
          }

          ctx.fillStyle = isEnergy
            ? 'rgba(' + pal.accent + ',' + Math.min(.9,alpha + gather*.22) + ')'
            : 'rgba(' + pal.star + ',' + alpha + ')';
          ctx.beginPath();
          ctx.arc(s.x,s.y,s.r*(.65+s.z*.7),0,Math.PI*2);
          ctx.fill();

          if (i % 43 === 0) {
            ctx.strokeStyle='rgba(' + pal.accent + ',' + (.06 + breathe*.05 + gather*.05) + ')';
            ctx.lineWidth=.65;
            ctx.beginPath();
            ctx.moveTo(s.x-12,s.y);
            ctx.lineTo(s.x+12,s.y);
            ctx.stroke();
          }
        });

        if (gather < .78) {
          drawComet(time,.12,1);
          drawComet(time,.61,-1);
          drawJourneyProbe(pal);
        }

        if (running) frame = requestAnimationFrame(drawCosmos);
      };

      addEventListener('scroll', () => {
        const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
        journeyProgress = clamp01(scrollY / max);
        scrollWarp = journeyProgress;
      }, {passive:true});
      addEventListener('resize', resizeCosmos, {passive:true});
      addEventListener('cosmic-theme-change', () => {
        if (running) return;
        if (reduced || document.hidden) { drawCosmos(0); return; }
        running = true;
        frame = requestAnimationFrame(drawCosmos);
      });
      document.addEventListener('visibilitychange', () => {
        if (reduced) return;
        if (document.hidden && running) {
          running = false;
          cancelAnimationFrame(frame);
        } else if (!document.hidden && !running) {
          running = true;
          frame = requestAnimationFrame(drawCosmos);
        }
      });

      resizeCosmos();
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      journeyProgress = clamp01(scrollY / max);
      scrollWarp = journeyProgress;
      if (reduced) drawCosmos(0);
      else frame = requestAnimationFrame(drawCosmos);
    }
  }

  /* Face hover becomes a gravity selector for the four evidence planets. */
  const portrait = document.querySelector('#portrait-stage');
  const identity = document.querySelector('#identity');
  const planets = portrait ? [...portrait.querySelectorAll('.planet')] : [];
  const core = portrait && portrait.querySelector('.security-core');
  let gravityIndex = 0;

  const setGravityNode = index => {
    gravityIndex = Math.max(0,Math.min(planets.length-1,index));
    planets.forEach((planet,i) => planet.classList.toggle('gravity-active', i === gravityIndex));
  };

  if (portrait && planets.length) {
    portrait.addEventListener('pointermove', event => {
      if (reduced || (!portrait.classList.contains('galaxy-mode') && !portrait.classList.contains('phase-planets'))) return;
      const rect = portrait.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - .5;
      const ny = (event.clientY - rect.top) / rect.height - .5;
      const index = ny < 0 ? (nx < 0 ? 0 : 1) : (nx < 0 ? 2 : 3);
      setGravityNode(index);
      if (core) core.classList.add('neural-flare');
    }, {passive:true});

    portrait.addEventListener('pointerleave', () => {
      planets.forEach(planet => planet.classList.remove('gravity-active'));
      if (core) core.classList.remove('neural-flare');
    });
  }

  let phaseFrame = 0;
  function updateIdentityPhases() {
    phaseFrame = 0;
    if (!portrait || !identity) return;
    const rect = identity.getBoundingClientRect();
    const travel = Math.max(1, identity.offsetHeight - innerHeight);
    const progress = Math.max(0, Math.min(1, -rect.top / travel));
    const galaxy = Math.max(0, Math.min(1, (progress - .16) / .56));
    portrait.style.setProperty('--brain-zoom', String(.72 + galaxy * .72));
    portrait.style.setProperty('--brain-flare', String(galaxy));
    portrait.style.setProperty('--brain-brightness', String(.78 + galaxy * .62));
    portrait.style.setProperty('--brain-saturation', String(.78 + galaxy * .72));
    portrait.classList.toggle('phase-ssh', progress > .34 && progress < .72);
    portrait.classList.toggle('phase-planets', progress >= .68);

    if (progress >= .68 && planets.length) {
      const hop = Math.min(planets.length - 1, Math.floor(((progress - .68) / .32) * planets.length));
      planets.forEach((planet,i) => planet.classList.toggle('scroll-active', i === hop));
    } else {
      planets.forEach(planet => planet.classList.remove('scroll-active'));
    }
  }
  addEventListener('scroll', () => {
    if (!phaseFrame) phaseFrame = requestAnimationFrame(updateIdentityPhases);
  }, {passive:true});
  addEventListener('resize', () => {
    if (!phaseFrame) phaseFrame = requestAnimationFrame(updateIdentityPhases);
  }, {passive:true});
  updateIdentityPhases();

  /* Cinematic planet-to-planet scene shifts and kinetic reveals. */
  const sceneMap = [
    [document.querySelector('#identity'),'identity'],
    [document.querySelector('#work'),'projects'],
    [document.querySelector('#investigations'),'investigations'],
    [document.querySelector('#archive'),'archive'],
    [document.querySelector('#arsenal'),'arsenal'],
    [document.querySelector('#roadmap'),'roadmap'],
    [document.querySelector('#contact'),'contact']
  ].filter(([node]) => Boolean(node));

  if ('IntersectionObserver' in window) {
    const sceneObserver = new IntersectionObserver(entries => {
      const live = entries
        .filter(entry => entry.isIntersecting)
        .sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!live) return;
      const found = sceneMap.find(([node]) => node === live.target);
      if (found) document.body.dataset.scene = found[1];
    }, {rootMargin:'-30% 0px -42% 0px',threshold:[0,.08,.2,.4]});
    sceneMap.forEach(([node]) => sceneObserver.observe(node));

    document.querySelectorAll('.section-title,.work-heading h2,.degree-copy h2,.about-note h1').forEach(heading => {
      heading.classList.add('scene-kinetic','scene-await');
      const headingObserver = new IntersectionObserver(([entry],obs) => {
        if (!entry.isIntersecting) return;
        heading.classList.remove('scene-await');
        heading.classList.add('scene-live');
        obs.disconnect();
      }, {threshold:.35});
      headingObserver.observe(heading);
    });
  } else {
    document.body.dataset.scene = 'identity';
  }

  document.querySelectorAll('.archive-groups .lab-row').forEach(row => {
    row.addEventListener('pointermove', event => {
      const rect = row.getBoundingClientRect();
      row.style.setProperty('--gallery-x', ((event.clientX-rect.left)/Math.max(1,rect.width)*100) + '%');
      row.style.setProperty('--gallery-y', ((event.clientY-rect.top)/Math.max(1,rect.height)*100) + '%');
    }, {passive:true});
  });

  /* Keep interactive controls classed consistently, without cursor-warp theatrics. */
  document.querySelectorAll(
    '#nav-links a,.pill,.case-open,.repo-link,.lab-row,.footer-links a,.theme-toggle'
  ).forEach(target => target.classList.add('gravity-link'));
})();



/* Minimal site traversal indicator: a single comet along the header edge. */
(() => {
  const progress = document.querySelector('#traverse-progress');
  if (!progress) return;
  let frame = 0;
  const update = () => {
    frame = 0;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const value = Math.max(0,Math.min(1,scrollY / max));
    progress.style.setProperty('--site-progress',String(value));
  };
  const queue = () => { if (!frame) frame = requestAnimationFrame(update); };
  addEventListener('scroll',queue,{passive:true});
  addEventListener('resize',queue,{passive:true});
  update();
})();

/* Orbital controls: moons around SECURITY + recruiter-safe contact orbit. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktopQuery = matchMedia('(min-width: 821px)');
  const portrait = document.querySelector('#portrait-stage');
  const planetSystem = portrait && portrait.querySelector('.planet-system');
  const moons = planetSystem ? [...planetSystem.querySelectorAll('.planet')] : [];
  const contactCard = document.querySelector('.contact-card');
  const contactNodes = contactCard ? [...contactCard.querySelectorAll('.contact-side .pill')] : [];

  let pointerX = -9999;
  let pointerY = -9999;
  let last = performance.now();
  let securityClock = 0;
  let contactClock = 0;
  let frame = 0;

  addEventListener('pointermove', event => {
    pointerX = event.clientX;
    pointerY = event.clientY;
  }, {passive:true});
  addEventListener('pointerleave', () => {
    pointerX = pointerY = -9999;
  });

  const phases = [Math.PI * 1.02, Math.PI * 1.84, Math.PI * .72, Math.PI * .18];
  const contactPhases = [Math.PI * .18, Math.PI * .82, Math.PI * 1.18, Math.PI * 1.82];

  function setMoonPosition(node, x, y, pullX = 0, pullY = 0, pulled = false) {
    node.style.setProperty('--moon-x', x.toFixed(2) + 'px');
    node.style.setProperty('--moon-y', y.toFixed(2) + 'px');
    node.style.setProperty('--moon-pull-x', pullX.toFixed(2) + 'px');
    node.style.setProperty('--moon-pull-y', pullY.toFixed(2) + 'px');
    node.classList.toggle('moon-pulled', pulled);
  }

  function drawMoons(dt) {
    if (!desktopQuery.matches || !portrait || !planetSystem || !moons.length) return;
    if (!portrait.classList.contains('galaxy-mode') && !portrait.classList.contains('phase-planets')) {
      moons.forEach(node => {
        node.classList.remove('moon-pulled');
        node.style.setProperty('--moon-pull-x','0px');
        node.style.setProperty('--moon-pull-y','0px');
      });
      return;
    }
    const rect = planetSystem.getBoundingClientRect();
    const rx = Math.min(rect.width * .34, 345);
    const ry = Math.min(rect.height * .27, 205);
    const hovered = moons.some(node => node.matches(':hover,:focus-visible'));
    if (!reduced && !hovered) securityClock += dt * .000055;

    moons.forEach((node, index) => {
      const angle = phases[index % phases.length] + securityClock;
      const x = Math.cos(angle) * rx;
      const y = Math.sin(angle) * ry;
      const sx = rect.left + rect.width / 2 + x;
      const sy = rect.top + rect.height / 2 + y;
      const dx = pointerX - sx;
      const dy = pointerY - sy;
      const dist = Math.hypot(dx,dy);
      const radius = 165;
      const proximity = Math.max(0,1 - dist / radius);
      const pull = proximity * proximity;
      const maxPull = 68;
      const norm = dist > 1 ? 1 / dist : 0;
      const pullX = dx * norm * maxPull * pull;
      const pullY = dy * norm * maxPull * pull;
      setMoonPosition(node,x,y,pullX,pullY,proximity > .08);
    });
  }

  const contactTitle = contactCard && contactCard.querySelector('.contact-title');
  const TITLE_CLEARANCE = 22;

  // Pushes an orbit position outward along its own direction until the pill's nearest edge
  // clears the title circle. A fixed ellipse cannot guarantee this for wide pills on diagonals.
  function clearTitle(x, y, halfW, halfH, cx, cy, radius) {
    let dx = x - cx;
    let dy = y - cy;
    for (let i = 0; i < 60; i++) {
      const gapX = Math.max(0, Math.abs(dx) - halfW);
      const gapY = Math.max(0, Math.abs(dy) - halfH);
      if (Math.hypot(gapX, gapY) >= radius) break;
      dx *= 1.03;
      dy *= 1.03;
    }
    return [cx + dx, cy + dy];
  }

  function drawContactOrbit(dt) {
    if (!desktopQuery.matches || !contactCard || !contactNodes.length) return;
    // Read every measurement before writing any style.
    const rect = contactCard.getBoundingClientRect();
    const title = contactTitle ? contactTitle.getBoundingClientRect() : null;
    const sizes = contactNodes.map(node => [node.offsetWidth / 2, node.offsetHeight / 2]);
    const rx = Math.min(rect.width * .355, 420);
    const ry = Math.min(rect.height * .31, 230);
    const tcx = title ? title.left + title.width / 2 - (rect.left + rect.width / 2) : 0;
    const tcy = title ? title.top + title.height / 2 - (rect.top + rect.height / 2) : 0;
    const radius = title ? Math.min(title.width, title.height) / 2 + TITLE_CLEARANCE : 0;
    const held = contactNodes.find(node => node.matches(':hover,:focus-visible'));
    if (!reduced && !held) contactClock += dt * .000095;

    contactNodes.forEach((node,index) => {
      const angle = contactPhases[index % contactPhases.length] + contactClock;
      const [x, y] = clearTitle(Math.cos(angle) * rx, Math.sin(angle) * ry, sizes[index][0], sizes[index][1], tcx, tcy, radius);
      node.style.setProperty('--contact-orbit-x', x.toFixed(2) + 'px');
      node.style.setProperty('--contact-orbit-y', y.toFixed(2) + 'px');
      node.classList.toggle('orbit-held',node === held);
    });
  }

  function clearMobileState() {
    if (desktopQuery.matches) return;
    moons.forEach(node => {
      node.style.removeProperty('--moon-x');
      node.style.removeProperty('--moon-y');
      node.style.removeProperty('--moon-pull-x');
      node.style.removeProperty('--moon-pull-y');
      node.classList.remove('moon-pulled');
    });
    contactNodes.forEach(node => {
      node.style.removeProperty('--contact-orbit-x');
      node.style.removeProperty('--contact-orbit-y');
      node.classList.remove('orbit-held');
    });
  }

  // The loop only runs while the planets or the contact card are on screen, on desktop, in a visible tab.
  let planetsOnScreen = false;
  let contactOnScreen = false;
  let running = false;

  function orbitFrame(now) {
    if (!running) return;
    const dt = Math.min(48,Math.max(0,now-last));
    last = now;
    if (planetsOnScreen) drawMoons(dt);
    if (contactOnScreen) drawContactOrbit(dt);
    frame = requestAnimationFrame(orbitFrame);
  }

  function syncOrbit() {
    const next = !reduced && !document.hidden && desktopQuery.matches && (planetsOnScreen || contactOnScreen);
    if (next && !running) {
      running = true;
      last = performance.now();
      frame = requestAnimationFrame(orbitFrame);
    } else if (!next && running) {
      running = false;
      cancelAnimationFrame(frame);
    }
  }

  const watch = (node, set) => node && new IntersectionObserver(([entry]) => { set(entry.isIntersecting); syncOrbit(); }).observe(node);
  watch(planetSystem, value => { planetsOnScreen = value; });
  watch(contactCard, value => { contactOnScreen = value; });
  document.addEventListener('visibilitychange', syncOrbit);
  desktopQuery.addEventListener?.('change', () => { clearMobileState(); syncOrbit(); });
  addEventListener('resize', () => { if (!running) { drawMoons(0); drawContactOrbit(0); } }, {passive:true});

  // Static layout for reduced motion (and a correct first paint for everyone).
  drawMoons(0);
  drawContactOrbit(0);
})();
