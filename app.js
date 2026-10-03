/* Progressive enhancement: the complete content remains readable without JS. */
const root = document.documentElement;
root.classList.add('js');
const themeButton = document.querySelector('#theme-toggle');
try {
  if (localStorage.getItem('hz-theme') === 'dark') root.dataset.theme = 'dark';
} catch { /* Storage can be unavailable for local files or private browsing. */ }
function updateThemeLabel() {
  const dark = root.dataset.theme === 'dark';
  themeButton.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  themeButton.setAttribute('aria-pressed', String(dark));
}
updateThemeLabel();
themeButton.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('hz-theme', root.dataset.theme); } catch {}
  updateThemeLabel();
});

const menuButton = document.querySelector('#menu-toggle');
const menu = document.querySelector('#main-nav');
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menu.classList.remove('is-open');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menu.classList.toggle('is-open', open);
});
menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.classList.contains('is-open')) {
    closeMenu(); menuButton.focus();
  }
});

const papers = [...document.querySelectorAll('.publication')];
const search = document.querySelector('#publication-search');
const count = document.querySelector('#publication-count');
function filterPublications() {
  const query = search.value.trim().normalize('NFKC').toLocaleLowerCase();
  let visible = 0;
  papers.forEach(paper => {
    const searchableText = `${paper.textContent} ${paper.querySelector('.doi-link')?.getAttribute('href') || ''}`;
    const matches = searchableText.normalize('NFKC').toLocaleLowerCase().includes(query);
    paper.hidden = !matches;
    if (matches) visible++;
  });
  document.querySelectorAll('.publication-group').forEach(group => {
    group.hidden = ![...group.querySelectorAll('.publication')].some(paper => !paper.hidden);
  });
  count.textContent = `${visible} ${visible === 1 ? 'entry' : 'entries'} shown`;
  document.querySelector('#no-publications').hidden = visible !== 0;
}
search.addEventListener('input', filterPublications);
document.querySelector('#clear-search').addEventListener('click', () => {
  search.value = ''; filterPublications(); search.focus();
});
document.querySelectorAll('[data-show-publications]').forEach(link => link.addEventListener('click', () => {
  search.value = ''; filterPublications();
}));
document.querySelector('#publication-controls').hidden = false;
filterPublications();

const tabs = [...document.querySelectorAll('#work-tabs [role="tab"]')];
const panels = [...document.querySelectorAll('[data-work-panel]')];
function selectTab(tab, moveFocus = false) {
  tabs.forEach(item => {
    const active = item === tab;
    item.setAttribute('aria-selected', String(active));
    item.tabIndex = active ? 0 : -1;
  });
  panels.forEach(panel => { panel.hidden = panel.id !== tab.getAttribute('aria-controls'); });
  if (moveFocus) tab.focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); selectTab(tabs[next], true); }
  });
});
document.querySelector('#work-tabs').hidden = false;
selectTab(tabs[0]);

const copyButton = document.querySelector('#copy-email');
if (navigator.clipboard && window.isSecureContext) {
  copyButton.hidden = false;
  copyButton.addEventListener('click', async () => {
    const status = document.querySelector('#copy-status');
    try {
      await navigator.clipboard.writeText('hz2831@columbia.edu');
      status.textContent = 'Email address copied.';
    } catch {
      status.textContent = 'Please select and copy hz2831@columbia.edu.';
    }
  });
}

// Scroll position determines one active section, including long publication lists.
const navLinks = [...menu.querySelectorAll('a[href^="#"]')];
const navSections = navLinks.map(link => document.querySelector(link.hash));
let navFrame = null;
function updateActiveSection() {
  navFrame = null;
  const threshold = Math.min(innerHeight * 0.28, 200);
  let active = -1;
  navSections.forEach((section, index) => {
    if (section && section.getBoundingClientRect().top <= threshold) active = index;
  });
  if (scrollY + innerHeight >= document.documentElement.scrollHeight - 6) active = navLinks.length - 1;
  navLinks.forEach((link, index) => {
    if (index === active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
function scheduleNavUpdate() {
  if (navFrame === null) navFrame = requestAnimationFrame(updateActiveSection);
}
window.addEventListener('scroll', scheduleNavUpdate, { passive: true });
window.addEventListener('resize', scheduleNavUpdate);
updateActiveSection();

// A deliberately simplified teaching model, NOT the laboratory actuator model.
// Example gains, drive response, disturbances, forces, and PWM values are synthetic.
function makeForceControlDemo() {
  const samplesPerCycle = 1000;
  const dt = 2 / samplesPerCycle;
  const kp = 0.07, ki = 1.6, kd = 0.001;
  let force = 4, integral = 0.125, previousError = 0, derivative = 0;
  let previousDuty = 0.2;
  const samples = [];
  for (let i = 0; i <= 13 * samplesPerCycle; i++) {
    const phase = (i % samplesPerCycle) / samplesPerCycle;
    const angle = 2 * Math.PI * phase;
    const target = 8 - 4 * Math.cos(angle);
    const measured = force + 0.012 * Math.sin(7 * angle);
    const error = target - measured;
    derivative += dt / (0.02 + dt) * ((error - previousError) / dt - derivative);
    const proposedIntegral = integral + error * dt;
    const proposedOutput = kp * error + ki * proposedIntegral + kd * derivative;
    // Conditional integration avoids accumulating error into saturation.
    if ((proposedOutput >= 0 && proposedOutput <= 1)
      || (proposedOutput > 1 && error < 0) || (proposedOutput < 0 && error > 0)) {
      integral = proposedIntegral;
    }
    const duty = Math.max(0, Math.min(1, kp * error + ki * integral + kd * derivative));
    const pwm = Math.round(255 * duty);
    if (i >= 12 * samplesPerCycle) samples.push({
      target, measured, error, duty: pwm / 255, pwm, change: duty - previousDuty
    });
    // Illustrative drive + mechanical response, with a small periodic disturbance.
    force += dt / 0.06 * (20 * pwm / 255 + 0.2 * Math.sin(3 * angle + 0.7) - force);
    previousError = error;
    previousDuty = duty;
  }
  return { samples, samplesPerCycle };
}

const forceDemo = makeForceControlDemo();
function connectForceDemo(system) {
  const values = [...system.querySelectorAll('[data-control-value]')];
  const steps = [...system.querySelectorAll('[data-control-step]')];
  const toX = phase => 52 + 522 * phase;
  const toY = force => 227 - 16 * force;
  ['target', 'measured'].forEach(key => {
    const path = forceDemo.samples.map((sample, index) =>
      `${index ? 'L' : 'M'}${toX(index / forceDemo.samplesPerCycle).toFixed(2)} ${toY(sample[key]).toFixed(2)}`
    ).join(' ');
    system.querySelector(`#${key}-force-trace`).setAttribute('d', path);
  });
  return function renderFeedback(phase, playing) {
    const sample = forceDemo.samples[Math.min(forceDemo.samplesPerCycle, Math.round(phase * forceDemo.samplesPerCycle))];
    const signed = value => `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(2)}`;
    // Keep displayed subtraction exact at the two-decimal UI precision.
    const shownTarget = Number(sample.target.toFixed(2));
    const shownMeasured = Number(sample.measured.toFixed(2));
    const shownError = Math.round((shownTarget - shownMeasured) * 100) / 100;
    const display = {
      target: shownTarget.toFixed(2), measured: shownMeasured.toFixed(2),
      error: signed(shownError), 'chart-error': signed(shownError),
      pwm: String(sample.pwm), duty: (100 * sample.duty).toFixed(1),
      action: sample.change > 0.00015 ? '↑ Increasing command' : sample.change < -0.00015 ? '↓ Decreasing command' : '≈ Holding command',
      relation: Math.abs(sample.error) < 0.025 ? 'Near target' : sample.error > 0 ? 'Measured below target' : 'Measured above target'
    };
    values.forEach(element => { element.textContent = display[element.dataset.controlValue]; });
    system.querySelector('[data-pwm-meter]').style.width = `${100 * sample.duty}%`;
    const x = toX(phase);
    system.querySelector('#force-chart-cursor').setAttribute('d', `M${x} 27V227`);
    ['target','measured'].forEach(key => {
      const marker = system.querySelector(`#${key}-force-marker`);
      marker.setAttribute('cx', x);
      marker.setAttribute('cy', toY(sample[key]));
    });
    // Signal-path highlighting is slowed for explanation, not controller timing.
    const activeStep = Math.floor(phase * 32) % steps.length;
    steps.forEach((step, index) => { step.dataset.active = String(playing && index === activeStep); });
    system.querySelector('[data-control-status]').textContent = playing ? 'Live illustration' : 'Paused';
  };
}

// Independent conceptual cutaways, aligned to the source platform figures.
// Motion is illustrative, not a mechanical solution or experimental measurement.
document.querySelectorAll('[data-test-system]').forEach(system => {
  const compression = system.dataset.testSystem === 'compression';
  const play = system.querySelector('.system-play');
  const phaseControl = system.querySelector('.system-phase');
  const speed = system.querySelector('.system-speed');
  const phaseLabel = system.querySelector('[data-phase-label]');
  const output = system.querySelector('.phase-control output');
  const feedbackPlay = system.querySelector('.feedback-play');
  const renderFeedback = compression ? null : connectForceDemo(system);
  const movingAssembly = system.querySelector(compression ? '#compression-piston' : '#tensile-grip');
  const sensorCore = system.querySelector(compression ? '#compression-lvdt-core' : '#tensile-lvdt-core');
  const specimen = system.querySelector(compression ? '#compression-tissue' : '#tensile-specimen');
  let phase = 0;
  let playing = false;
  let frame = null;
  let lastTime = null;

  function renderCycle() {
    if (compression) {
      // 25 px platen thickness; 50 px retracted clearance. Drawing dimensions only.
      // Contact loading is a separate part of the cycle, so retraction does not
      // increase specimen indentation (maximum 0.5 px of a 16 px thickness).
      const smooth = x => x * x * (3 - 2 * x);
      let travel;
      if (phase < 0.3) travel = -50 * (1 - smooth(phase / 0.3));
      else if (phase <= 0.7) travel = 0.5 * Math.sin(Math.PI * (phase - 0.3) / 0.4) ** 2;
      else travel = -50 * smooth((phase - 0.7) / 0.3);
      const indentation = Math.max(0, travel);
      const scale = 1 - indentation / 16;
      movingAssembly.setAttribute('transform', `translate(0 ${travel})`);
      sensorCore.setAttribute('transform', `translate(0 ${travel})`);
      system.querySelector('#compression-platen-label').setAttribute('transform', `translate(0 ${travel})`);
      specimen.setAttribute('transform', `translate(0 ${300 * (1 - scale)}) scale(1 ${scale})`);
    } else {
      const sample = forceDemo.samples[Math.min(forceDemo.samplesPerCycle, Math.round(phase * forceDemo.samplesPerCycle))];
      // Small conceptual extension follows the illustrative measured-force cycle.
      const extension = 2.4 * Math.max(0, Math.min(1, (sample.measured - 4) / 8));
      // Scale about the fixed lower attachment; upper attachment follows the grip.
      const scale = 1 + extension / (305 - 216);
      movingAssembly.setAttribute('transform', `translate(0 ${-extension})`);
      sensorCore.setAttribute('transform', `translate(0 ${-extension})`);
      specimen.setAttribute('transform', `translate(0 ${305 * (1 - scale)}) scale(1 ${scale})`);
      system.querySelector('#tensile-grip-leader').setAttribute('d', `M277 ${206 - extension}H157`);
    }
    const stage = compression
      ? (phase === 0 || phase === 1 ? 'Retracted' : phase < 0.3 ? 'Approaching' : phase < 0.5 ? 'Loading' : phase <= 0.7 ? 'Unloading' : 'Retracting')
      : (phase < 0.5 ? 'Increasing tension' : 'Releasing tension');
    phaseLabel.textContent = playing ? stage : `Paused · ${stage.toLowerCase()}`;
    phaseControl.value = String(phase * 100);
    phaseControl.setAttribute('aria-valuetext', `${Math.round(phase * 100)} percent of cycle, ${stage.toLowerCase()}`);
    output.textContent = `${Math.round(phase * 100)}%`;
    if (renderFeedback) renderFeedback(phase, playing);
  }
  function tick(time) {
    if (!playing) return;
    if (lastTime !== null) {
      // Compression full-speed period follows 2 Hz; tensile timing is illustrative.
      const period = compression ? 500 : 2000;
      phase = (phase + Math.min(time - lastTime, 100) * Number(speed.value) / period) % 1;
    }
    lastTime = time;
    renderCycle();
    frame = requestAnimationFrame(tick);
  }
  function setPlaying(next) {
    playing = next;
    lastTime = null;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    play.setAttribute('aria-pressed', String(playing));
    play.textContent = playing ? 'Pause animation' : 'Play animation';
    if (feedbackPlay) {
      feedbackPlay.setAttribute('aria-pressed', String(playing));
      feedbackPlay.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} tensile feedback demonstration`);
      feedbackPlay.textContent = playing ? 'Pause feedback demo' : 'Play feedback demo';
    }
    play.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} ${compression ? 'compression' : 'tensile'} animation`);
    renderCycle();
    if (playing) frame = requestAnimationFrame(tick);
  }
  play.addEventListener('click', () => setPlaying(!playing));
  if (feedbackPlay) {
    feedbackPlay.hidden = false;
    feedbackPlay.addEventListener('click', () => setPlaying(!playing));
  }
  phaseControl.addEventListener('input', () => {
    const requestedPhase = Number(phaseControl.value) / 100;
    setPlaying(false);
    phase = requestedPhase;
    renderCycle();
  });
  speed.addEventListener('change', () => { lastTime = null; });
  document.addEventListener('visibilitychange', () => { if (document.hidden) setPlaying(false); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) setPlaying(false);
    }).observe(system);
  }
  system.querySelector('.test-controls').hidden = false;
  renderCycle();
});
