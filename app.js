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

if ('IntersectionObserver' in window) {
  const navLinks = [...menu.querySelectorAll('a[href^="#"]')];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) navLinks.forEach(link => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-12% 0px -65% 0px' });
  navLinks.forEach(link => {
    const section = document.querySelector(link.hash);
    if (section) observer.observe(section);
  });
}


// Independent conceptual cutaways, aligned to the source platform figures.
// Motion is illustrative, not a mechanical solution or experimental measurement.
document.querySelectorAll('[data-test-system]').forEach(system => {
  const compression = system.dataset.testSystem === 'compression';
  const play = system.querySelector('.system-play');
  const phaseControl = system.querySelector('.system-phase');
  const speed = system.querySelector('.system-speed');
  const phaseLabel = system.querySelector('[data-phase-label]');
  const output = system.querySelector('output');
  const movingAssembly = system.querySelector(compression ? '#compression-piston' : '#tensile-grip');
  const sensorCore = system.querySelector(compression ? '#compression-lvdt-core' : '#tensile-lvdt-core');
  const specimen = system.querySelector(compression ? '#compression-tissue' : '#tensile-specimen');
  let phase = 0;
  let playing = false;
  let frame = null;
  let lastTime = null;

  function renderCycle() {
    const cycle = (1 - Math.cos(phase * Math.PI * 2)) / 2;
    if (compression) {
      // The curved platen reaches the flat tissue surface after 2 px of travel.
      // Then only 0.5 px of the 16 px specimen thickness is compressed.
      const travel = 2.5 * cycle;
      const indentation = Math.max(0, travel - 2);
      const scale = 1 - indentation / 16;
      movingAssembly.setAttribute('transform', `translate(0 ${travel})`);
      sensorCore.setAttribute('transform', `translate(0 ${travel})`);
      specimen.setAttribute('transform', `translate(0 ${300 * (1 - scale)}) scale(1 ${scale})`);
    } else {
      const extension = 2.4 * cycle;
      // Scale about the fixed lower attachment; upper attachment follows the grip.
      const scale = 1 + extension / (305 - 216);
      movingAssembly.setAttribute('transform', `translate(0 ${-extension})`);
      sensorCore.setAttribute('transform', `translate(0 ${-extension})`);
      specimen.setAttribute('transform', `translate(0 ${305 * (1 - scale)}) scale(1 ${scale})`);
      system.querySelector('#tensile-grip-leader').setAttribute('d', `M277 ${206 - extension}H157`);
    }
    const stage = phase < 0.5
      ? (compression ? 'Loading' : 'Increasing tension')
      : (compression ? 'Unloading' : 'Releasing tension');
    phaseLabel.textContent = playing ? stage : `Paused · ${stage.toLowerCase()}`;
    phaseControl.value = String(phase * 100);
    phaseControl.setAttribute('aria-valuetext', `${Math.round(phase * 100)} percent of cycle, ${stage.toLowerCase()}`);
    output.textContent = `${Math.round(phase * 100)}%`;
  }
  function tick(time) {
    if (!playing) return;
    if (lastTime !== null) {
      // Compression full-speed period follows 2 Hz; tensile timing is illustrative.
      const period = compression ? 500 : 1000;
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
    play.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} ${compression ? 'compression' : 'tensile'} animation`);
    renderCycle();
    if (playing) frame = requestAnimationFrame(tick);
  }
  play.addEventListener('click', () => setPlaying(!playing));
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
