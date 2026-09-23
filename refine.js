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

  const correctedCases = {
    sirts: {
      title: 'CCorp SIRTS — Final-Year Capstone',
      lede: 'My BSc final-year capstone project: an incident and service-request tracking system shaped around the operational needs of a fictional SOC.',
      role: 'Capstone project work delivered in a team context, with my portfolio evidence focused on incident workflow, role boundaries, auditability, testing and technical evaluation.',
      method: 'Mapped incident and service-request lifecycles, role-based access, state transitions and audit requirements into a database-backed workflow that could be tested against defined requirements.',
      evidence: [
        'Final-year capstone project and report evidence',
        'Role-based incident and request workflows',
        'Audit history and lifecycle state tracking',
        'Testing, requirements and implementation documentation'
      ],
      learning: 'Incident-response tooling is credible only when ownership, state, escalation and evidence remain clear from intake to closure.',
      next: 'Complete the final capstone evaluation and preserve the production-readiness evidence alongside the academic report.',
      repo: 'https://github.com/cyr6x/ccorp-sirts'
    },
    ctech: {
      title: 'C TECH Inventory Management System — Coursework Build',
      lede: 'A general software-development coursework project covering inventory, orders, suppliers, users and reporting. It is included as evidence of systems delivery, not as a cybersecurity solution.',
      role: 'Coursework build demonstrating end-to-end application thinking, data handling, testing and documentation.',
      method: 'Connected interface, application logic and persistent data into operational workflows for stock, suppliers, orders, users and reports.',
      evidence: [
        'Inventory and supplier workflows',
        'Order and reporting functions',
        'User administration and audit records',
        'Coursework architecture, testing and documentation'
      ],
      learning: 'The value here is systems thinking and delivery discipline rather than a security claim.',
      next: 'Keep it as supporting coursework evidence while security projects remain the centre of the portfolio.',
      repo: 'https://github.com/cyr6x/CTECH-IMS'
    }
  };

  const dialog = document.querySelector('#case-dialog');
  const dialogBody = document.querySelector('#dialog-body');

  function renderCorrectedCase(key) {
    const data = correctedCases[key];
    if (!data || !dialog || !dialogBody) return false;

    dialogBody.innerHTML =
      '<h2>' + data.title + '</h2>' +
      '<p class="dialog-lede">' + data.lede + '</p>' +
      '<div class="dialog-grid">' +
        '<section class="dialog-block"><h3>My position</h3><p>' + data.role + '</p></section>' +
        '<section class="dialog-block"><h3>Method</h3><p>' + data.method + '</p></section>' +
        '<section class="dialog-block"><h3>Evidence</h3><ul>' +
          data.evidence.map(item => '<li>' + item + '</li>').join('') +
        '</ul></section>' +
        '<section class="dialog-block"><h3>What changed in my thinking</h3><p>' + data.learning + '</p></section>' +
        '<section class="dialog-block"><h3>Next move</h3><p>' + data.next + '</p></section>' +
      '</div>' +
      '<div class="dialog-repo"><a class="pill" href="' + data.repo + '" target="_blank" rel="noreferrer noopener">Inspect repository ↗</a></div>';

    dialog.showModal();
    return true;
  }

  document.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const trigger = event.target.closest('[data-case] .case-open, .lab-row[data-case]');
    if (!trigger) return;
    const owner = trigger.closest('[data-case]');
    const key = owner && owner.dataset.case;
    if (!correctedCases[key]) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    renderCorrectedCase(key);
  }, true);

  const contacts = {
    email: {
      value: 'baayacyril@gmail.com · baayacyril@outlook.com',
      href: 'mailto:baayacyril@gmail.com'
    },
    phone: {
      value: '+254 795 794 573',
      href: 'tel:+254795794573'
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
        if (value) value.textContent = item.value;
        button.title = 'Click again to open';
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
  let running = !reduced;
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

  function draw(time = 0) {
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
    glow.addColorStop(0, 'rgba(255,48,56,.06)');
    glow.addColorStop(0.58, 'rgba(255,48,56,.018)');
    glow.addColorStop(1, 'rgba(255,48,56,0)');
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
      ctx.strokeStyle = ring === 0 ? 'rgba(255,48,56,.17)' : 'rgba(211,219,230,.08)';
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
        ? 'rgba(255,48,56,' + Math.min(0.8, alpha + 0.35) + ')'
        : 'rgba(218,226,236,' + alpha + ')';
      ctx.fill();

      if (index % 47 === 0 && rz > -0.15) {
        ctx.beginPath();
        ctx.arc(x, y, 5.5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,48,56,.13)';
        ctx.stroke();
      }
    });

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(225,232,240,.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (running) frame = requestAnimationFrame(draw);
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

  const observer = new IntersectionObserver(entries => {
    const visible = entries.some(entry => entry.isIntersecting);
    if (reduced) {
      running = false;
      draw(0);
      return;
    }
    if (visible && !running) {
      running = true;
      frame = requestAnimationFrame(draw);
    } else if (!visible && running) {
      running = false;
      cancelAnimationFrame(frame);
    }
  }, {threshold:0.05});

  size();
  if (reduced) draw(0);
  else frame = requestAnimationFrame(draw);
  observer.observe(canvas);

  addEventListener('resize', () => {
    size();
    if (!running) draw(0);
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
    addEventListener('keydown', event => {
      if ((event.key === 'Enter' || event.key === 'Escape') && !rootLoader.classList.contains('is-leaving')) finishRootBoot();
    }, {once:true});
  }

  const themeToggle = document.querySelector('#theme-toggle');
  const themeLabel = themeToggle && themeToggle.querySelector('.theme-label');

  function setTheme(theme, persist = false) {
    const next = theme === 'light' ? 'light' : 'dark';
    if (persist) {
      root.classList.add('theme-switching');
      setTimeout(() => root.classList.remove('theme-switching'), 560);
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

  /* Living cosmic wallpaper. Intentionally lightweight and dependency-free. */
  const cosmos = document.querySelector('#cosmos');
  if (cosmos) {
    const ctx = cosmos.getContext('2d', {alpha:true});
    if (ctx) {
      let w = 1, h = 1, dpr = 1, frame = 0, last = 0, running = !reduced;
      let stars = [], motes = [], scrollWarp = 0, journeyProgress = 0;

      const makeField = () => {
        const density = Math.max(95, Math.min(210, Math.floor((w * h) / 8400)));
        stars = Array.from({length:density}, (_, i) => ({
          x: Math.random() * w,
          y: Math.random() * h,
          z: Math.random() * .9 + .1,
          r: i % 37 === 0 ? 1.55 : Math.random() * .72 + .18,
          p: Math.random() * Math.PI * 2,
          vx:(Math.random() - .5) * .018,
          vy:(Math.random() - .5) * .012
        }));
        motes = Array.from({length:26}, () => ({
          x:Math.random() * w,
          y:Math.random() * h,
          p:Math.random() * Math.PI * 2,
          r:Math.random() * 95 + 55
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

      const sceneAccents = {
        identity:'255,48,56',
        projects:'255,48,56',
        investigations:'139,120,255',
        archive:'96,185,255',
        arsenal:'117,216,154',
        roadmap:'242,189,89',
        contact:'255,48,56'
      };
      const palette = () => {
        const scene = document.body.dataset.scene || 'identity';
        const accent = sceneAccents[scene] || sceneAccents.identity;
        return root.dataset.theme === 'light'
          ? {star:'39,57,77', faint:'53,78,101', accent, nebula:'79,104,132'}
          : {star:'223,232,242', faint:'126,146,171', accent, nebula:'72,82,112'};
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
        if (journeyProgress < .08 || journeyProgress > .94) return;
        const t = Math.max(0,Math.min(1,(journeyProgress-.08)/.86));
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

        ctx.beginPath();
        ctx.arc(x,y,8.5,0,Math.PI*2);
        ctx.strokeStyle = 'rgba(' + pal.accent + ',.16)';
        ctx.lineWidth = .7;
        ctx.stroke();
      };

      const drawCosmos = (time = 0) => {
        if (!reduced && time - last < 32) {
          frame = requestAnimationFrame(drawCosmos);
          return;
        }
        last = time;
        ctx.clearRect(0,0,w,h);
        const pal = palette();
        const breathe = .5 + .5 * Math.sin(time * .00035);

        const nebulaA = ctx.createRadialGradient(w*.25,h*.32,0,w*.25,h*.32,Math.max(w,h)*.48);
        nebulaA.addColorStop(0,'rgba(' + pal.nebula + ',' + (.028 + breathe*.018) + ')');
        nebulaA.addColorStop(.55,'rgba(' + pal.accent + ',' + (.012 + breathe*.008) + ')');
        nebulaA.addColorStop(1,'rgba(' + pal.accent + ',0)');
        ctx.fillStyle = nebulaA;
        ctx.fillRect(0,0,w,h);

        const nebulaB = ctx.createRadialGradient(w*.78,h*.7,0,w*.78,h*.7,Math.max(w,h)*.42);
        nebulaB.addColorStop(0,'rgba(' + pal.accent + ',' + (.018 + (1-breathe)*.012) + ')');
        nebulaB.addColorStop(1,'rgba(' + pal.accent + ',0)');
        ctx.fillStyle = nebulaB;
        ctx.fillRect(0,0,w,h);

        motes.forEach((m,i) => {
          const drift = reduced ? 0 : Math.sin(time*.00012 + m.p) * 18;
          const g = ctx.createRadialGradient(m.x+drift,m.y,0,m.x+drift,m.y,m.r);
          g.addColorStop(0,'rgba(' + pal.faint + ',' + (i%7===0?.028:.014) + ')');
          g.addColorStop(1,'rgba(' + pal.faint + ',0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(m.x+drift,m.y,m.r,0,Math.PI*2);
          ctx.fill();
        });

        stars.forEach((s,i) => {
          if (!reduced) {
            s.x += s.vx * (1 + scrollWarp * 5);
            s.y += s.vy * (1 + scrollWarp * 3);
            if (s.x < -5) s.x = w + 5;
            if (s.x > w + 5) s.x = -5;
            if (s.y < -5) s.y = h + 5;
            if (s.y > h + 5) s.y = -5;
          }
          const twinkle = reduced ? .52 : .35 + Math.sin(time*.0011*s.z + s.p) * .22;
          const alpha = Math.max(.08, twinkle * (.5 + s.z*.55));
          ctx.fillStyle = 'rgba(' + pal.star + ',' + alpha + ')';
          ctx.beginPath();
          ctx.arc(s.x,s.y,s.r*(.65+s.z*.65),0,Math.PI*2);
          ctx.fill();

          if (i % 43 === 0) {
            ctx.strokeStyle='rgba(' + pal.accent + ',' + (.05 + breathe*.045) + ')';
            ctx.lineWidth=.65;
            ctx.beginPath();
            ctx.moveTo(s.x-12,s.y);
            ctx.lineTo(s.x+12,s.y);
            ctx.stroke();
          }
        });

        if (!reduced) {
          drawComet(time,.17,1);
          drawComet(time,.69,-1);
        }
        drawJourneyProbe(pal);
        if (running) frame = requestAnimationFrame(drawCosmos);
      };

      addEventListener('scroll', () => {
        const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
        journeyProgress = Math.max(0,Math.min(1,scrollY / max));
        scrollWarp = journeyProgress;
      }, {passive:true});
      addEventListener('resize', resizeCosmos, {passive:true});
      addEventListener('cosmic-theme-change', () => { if (!running) drawCosmos(0); });
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
      if (reduced) drawCosmos(0);
      else frame = requestAnimationFrame(drawCosmos);
    }
  }

  /* Face hover becomes a gravity selector for the four evidence planets. */
  const portrait = document.querySelector('#portrait-stage');
  const identity = document.querySelector('#identity');
  const planets = portrait ? [...portrait.querySelectorAll('.planet')] : [];
  const core = portrait && portrait.querySelector('.security-core');
  const neuralLock = document.querySelector('#neural-lock');
  const neuralLockTitle = neuralLock && neuralLock.querySelector('b');
  const neuralLockHint = neuralLock && neuralLock.querySelector('small');
  let gravityIndex = 0;
  let neuralLocked = false;

  const setGravityNode = index => {
    gravityIndex = Math.max(0,Math.min(planets.length-1,index));
    planets.forEach((planet,i) => planet.classList.toggle('gravity-active', i === gravityIndex));
  };

  const setNeuralLock = locked => {
    neuralLocked = Boolean(locked);
    portrait?.classList.toggle('is-locked',neuralLocked);
    neuralLock?.setAttribute('aria-pressed',String(neuralLocked));
    if (neuralLocked) {
      setGravityNode(gravityIndex);
      portrait?.classList.add('is-alive');
      if (core) core.classList.add('neural-flare');
      if (neuralLockTitle) neuralLockTitle.textContent = 'RELEASE NEURAL MAP';
      if (neuralLockHint) neuralLockHint.textContent = 'node 0' + (gravityIndex + 1) + ' locked';
    } else {
      if (neuralLockTitle) neuralLockTitle.textContent = 'LOCK NEURAL MAP';
      if (neuralLockHint) neuralLockHint.textContent = 'freeze the active gravity node';
    }
  };

  if (portrait && planets.length) {
    portrait.addEventListener('pointermove', event => {
      if (reduced) return;
      const rect = portrait.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - .5;
      const ny = (event.clientY - rect.top) / rect.height - .5;
      const index = ny < 0 ? (nx < 0 ? 0 : 1) : (nx < 0 ? 2 : 3);
      if (!neuralLocked) setGravityNode(index);
      if (core) core.classList.add('neural-flare');
    }, {passive:true});

    portrait.addEventListener('pointerleave', () => {
      if (neuralLocked) {
        setGravityNode(gravityIndex);
        portrait.classList.add('is-alive');
        if (core) core.classList.add('neural-flare');
        return;
      }
      planets.forEach(planet => planet.classList.remove('gravity-active'));
      if (core) core.classList.remove('neural-flare');
    });
  }

  neuralLock?.addEventListener('click', () => setNeuralLock(!neuralLocked));
  addEventListener('keydown', event => {
    if (event.key === 'Escape' && neuralLocked) setNeuralLock(false);
  });

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

  /* Magnetic event-horizon interaction for clickable words. */
  const finePointer = matchMedia('(pointer:fine)').matches;
  if (finePointer && !reduced) {
    const targets = [...document.querySelectorAll(
      '#nav-links a,.pill,.case-open,.repo-link,.lab-row,.footer-links a,.theme-toggle,.neural-lock'
    )];
    targets.forEach(target => {
      target.classList.add('gravity-link');
      if (!target.querySelector(':scope > .event-horizon')) {
        const horizon = document.createElement('span');
        horizon.className = 'event-horizon';
        horizon.setAttribute('aria-hidden','true');
        target.appendChild(horizon);
      }
    });

    let px = -9999, py = -9999, magnetFrame = 0;
    function magnetise() {
      magnetFrame = 0;
      targets.forEach(target => {
        const rect = target.getBoundingClientRect();
        const cx = rect.left + rect.width/2;
        const cy = rect.top + rect.height/2;
        const dx = px - cx;
        const dy = py - cy;
        const dist = Math.hypot(dx,dy);
        const radius = Math.max(115, Math.min(170, rect.width * .85 + 70));
        const intensity = Math.max(0, 1 - dist / radius);

        if (intensity <= 0) {
          target.classList.remove('is-gravity');
          target.style.setProperty('--grav-x','0px');
          target.style.setProperty('--grav-y','0px');
          target.style.setProperty('--grav-scale','1');
          target.style.setProperty('--horizon-alpha','0');
          return;
        }

        const pull = intensity * intensity;
        target.classList.add('is-gravity');
        target.style.setProperty('--grav-x',(dx * .075 * pull).toFixed(2) + 'px');
        target.style.setProperty('--grav-y',(dy * .075 * pull).toFixed(2) + 'px');
        target.style.setProperty('--grav-scale',String(1 + pull * .026));
        target.style.setProperty('--horizon-alpha',String(.18 + pull * .55));
        target.style.setProperty('--horizon-scale',String(.5 + pull * 1.15));
        target.style.setProperty('--horizon-x',Math.max(0,Math.min(100,((px-rect.left)/Math.max(1,rect.width))*100)) + '%');
        target.style.setProperty('--horizon-y',Math.max(0,Math.min(100,((py-rect.top)/Math.max(1,rect.height))*100)) + '%');
      });
    }

    addEventListener('pointermove', event => {
      px = event.clientX;
      py = event.clientY;
      if (!magnetFrame) magnetFrame = requestAnimationFrame(magnetise);
    }, {passive:true});
    addEventListener('pointerleave', () => {
      px = py = -9999;
      if (!magnetFrame) magnetFrame = requestAnimationFrame(magnetise);
    });
  }
})();
