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

const filterButtons = [...document.querySelectorAll('[data-filter]')];
const papers = [...document.querySelectorAll('.publication')];
const search = document.querySelector('#publication-search');
const count = document.querySelector('#publication-count');
let selectedCategory = 'full-length';
function filterPublications() {
  const query = search.value.trim().normalize('NFKC').toLocaleLowerCase();
  let visible = 0;
  papers.forEach(paper => {
    const searchableText = `${paper.textContent} ${paper.querySelector('.doi-link')?.getAttribute('href') || ''}`;
    const matches = paper.dataset.category === selectedCategory
      && searchableText.normalize('NFKC').toLocaleLowerCase().includes(query);
    paper.hidden = !matches;
    if (matches) visible++;
  });
  filterButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === selectedCategory)));
  count.textContent = `${visible} ${visible === 1 ? 'entry' : 'entries'} shown`;
  document.querySelector('#no-publications').hidden = visible !== 0;
}
filterButtons.forEach(button => button.addEventListener('click', () => {
  selectedCategory = button.dataset.filter;
  filterPublications();
}));
search.addEventListener('input', filterPublications);
document.querySelector('#clear-search').addEventListener('click', () => {
  search.value = ''; filterPublications(); search.focus();
});
document.querySelectorAll('[data-show-publications]').forEach(link => link.addEventListener('click', () => {
  selectedCategory = link.dataset.showPublications; search.value = ''; filterPublications();
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


// Two conceptual apparatus animations, driven by one cycle phase.
// No displayed motion, strain, or feedback trace is experimental data.
const studio = document.querySelector('.instrument-studio');
if (studio) {
  const deviceTabs = [...studio.querySelectorAll('[role="tab"]')];
  const devicePanels = [...studio.querySelectorAll('[data-instrument]')];
  const play = studio.querySelector('#studio-play');
  const phaseControl = studio.querySelector('#cycle-phase');
  const speed = studio.querySelector('#studio-speed');
  const caption = studio.querySelector('#studio-caption');
  const piston = studio.querySelector('#compression-piston');
  const tissue = studio.querySelector('#compression-tissue');
  const grip = studio.querySelector('#tensile-grip');
  const gripCallout = studio.querySelector('#tensile-grip-callout');
  const specimen = studio.querySelector('#tensile-specimen');
  const fibers = studio.querySelector('#tensile-fibers');
  const sensor = studio.querySelector('#sensor-light');
  const returnPath = studio.querySelector('#feedback-return');
  const particle = studio.querySelector('#feedback-particle');
  const returnLength = returnPath.getTotalLength();
  let mode = 'compression';
  let phase = 0;
  let playing = false;
  let frame = null;
  let lastTime = null;

  function renderCycle() {
    const load = (1 - Math.cos(phase * Math.PI * 2)) / 2;
    piston.setAttribute('transform', `translate(0 ${-24 * (1 - load)})`);
    const compressionScale = 1 - 0.18 * load;
    tissue.setAttribute('transform', `translate(0 ${414 * (1 - compressionScale)}) scale(1 ${compressionScale})`);
    grip.setAttribute('transform', `translate(0 ${-30 * load})`);
    gripCallout.setAttribute('d', `M327 ${290 - 30 * load} L416 290`);
    const top = 301 - 30 * load;
    const length = 373 - top;
    const upperWaist = top + length * 0.4;
    const lowerWaist = top + length * 0.66;
    specimen.setAttribute('d', `M280 ${top} H320 V${top + 12} C320 ${top + 22} 309 ${upperWaist - 10} 309 ${upperWaist} V${lowerWaist} C309 ${lowerWaist + 10} 320 355 320 364 V373 H280 V364 C280 355 291 ${lowerWaist + 10} 291 ${lowerWaist} V${upperWaist} C291 ${upperWaist - 10} 280 ${top + 22} 280 ${top + 12} Z`);
    fibers.setAttribute('d', `M296 ${top + 10} V363 M300 ${top + 8} V365 M304 ${top + 10} V363`);
    sensor.setAttribute('opacity', String(0.45 + 0.55 * load));
    const point = returnPath.getPointAtLength(phase * returnLength);
    particle.setAttribute('cx', point.x);
    particle.setAttribute('cy', point.y);
    phaseControl.value = String(phase * 100);
    const stage = phase < 0.5 ? (mode === 'compression' ? 'Loading' : 'Increasing tension') : (mode === 'compression' ? 'Unloading' : 'Releasing tension');
    phaseControl.setAttribute('aria-valuetext', `${Math.round(phase * 100)} percent of cycle, ${stage.toLowerCase()}`);
    studio.querySelectorAll('[data-phase-label]').forEach(label => { label.textContent = playing ? stage : `Paused · ${stage.toLowerCase()}`; });
  }
  function tick(time) {
    if (!playing) return;
    if (lastTime !== null) {
      // Compression period follows the 2 Hz source protocol; tensile timing is illustrative.
      const duration = mode === 'compression' ? 500 : 1000;
      phase = (phase + Math.min(time - lastTime, 100) * Number(speed.value) / duration) % 1;
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
    studio.dataset.playing = String(playing);
    play.setAttribute('aria-pressed', String(playing));
    play.querySelector('span').textContent = playing ? 'Pause animation' : 'Play animation';
    renderCycle();
    if (playing) frame = requestAnimationFrame(tick);
  }
  function selectDevice(tab, focus = false) {
    setPlaying(false);
    mode = tab.id === 'compression-tab' ? 'compression' : 'tension';
    phase = 0;
    deviceTabs.forEach(item => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
    });
    devicePanels.forEach(panel => { panel.hidden = panel.dataset.instrument !== mode; });
    caption.textContent = mode === 'compression'
      ? 'Adapted from my compression apparatus and proposal animation. Motion and tissue deformation are illustrative; the experimental compression frequency is 2 Hz.'
      : 'Based on my tensile tester CAD and control description. Motion, strain, playback timing, and signal flow are illustrative; they do not represent measured data.';
    renderCycle();
    if (focus) tab.focus();
  }
  deviceTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectDevice(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') next = (index + 1) % deviceTabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = deviceTabs.length - 1;
      if (next !== undefined) { event.preventDefault(); selectDevice(deviceTabs[next], true); }
    });
  });
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
    }).observe(studio);
  }
  studio.querySelector('.instrument-tabs').hidden = false;
  studio.querySelector('.studio-controls').hidden = false;
  selectDevice(deviceTabs[0]);
}
