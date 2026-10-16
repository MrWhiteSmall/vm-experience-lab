import { discs, categories } from './catalog.js';

const $ = selector => document.querySelector(selector);
const state = { phase: 'idle', focused: false, disc: null, emulator: null, token: 0, filter: 'all', input: false, absolutePointer: false };
const room = $('.room');
const screen = $('#screen');
const vmScreen = $('#vm-screen');
const tooltip = $('#discovery-card');
const workstation = $('.workstation');
let driveTimer;
let errorTimer;
let menuTimer;
let hoverTimer;
let hoverDisc;
let screenWidth = 640;
let screenHeight = 480;

window.vmLab = { get phase() { return state.phase; }, get emulator() { return state.emulator; }, get disc() { return state.disc?.id; } };

for (const row of document.querySelectorAll('[data-keys]')) {
  const letters = row === document.querySelector('[data-keys]') ? 'ESC1234567890−=' : 'QWERTYUIOP[]⌫⌫';
  row.innerHTML = Array.from({ length: Number(row.dataset.keys) }, (_, i) => `<i>${letters[i] || '·'}</i>`).join('');
}

function renderShelf() {
  const visible = discs.filter(disc => state.filter === 'all' || disc.category === state.filter);
  $('#shelf-counter').textContent = `${String(visible.length).padStart(2, '0')} DISCS`;
  $('#disc-list').innerHTML = Object.entries(categories).map(([key, category]) => {
    const entries = visible.filter(disc => disc.category === key);
    if (!entries.length) return '';
    return `<div class="disc-group"><div class="disc-group-label"><span>${category.name}</span><span>${category.english}</span></div>${entries.map(disc => `
      <div class="disc-item ${disc.ready ? 'ready' : ''} ${state.disc?.id === disc.id ? 'inserted' : ''}" style="--disc-accent:${disc.accent};--disc-paper:${disc.paper};--tilt:${disc.tilt}" data-disc="${disc.id}">
        <button class="disc-button" data-start="${disc.id}" aria-label="${disc.ready ? '插入并启动' : '查看介绍：'} ${disc.name}" aria-describedby="discovery-card">
          <span class="case-spine" aria-hidden="true"></span><span class="disc-cover"><span class="disc-index">VOL. ${disc.number} / ${disc.version}</span><strong>${disc.name}${key === 'china' ? '<span class="disc-country">国产</span>' : ''}</strong><small>${state.disc?.id === disc.id ? '正在电脑中 · 本次会话' : disc.subtitle}</small></span><span class="compact-disc" aria-hidden="true"></span><span class="disc-ready" aria-hidden="true"></span>
        </button><button class="disc-info-button" data-info="${disc.id}" aria-label="了解 ${disc.name}">i</button>
      </div>`).join('')}</div>`;
  }).join('');

  for (const item of document.querySelectorAll('.disc-item')) {
    const disc = discs.find(d => d.id === item.dataset.disc);
    item.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') queueCard(disc, item); });
    item.addEventListener('pointerleave', hideCard);
    const button = item.querySelector('.disc-button');
    button.addEventListener('focus', () => queueCard(disc, item));
    button.addEventListener('blur', hideCard);
    button.addEventListener('click', () => {
      hideCard();
      if (disc.ready) boot(disc, button);
      else showDetails(disc);
    });
    item.querySelector('.disc-info-button').addEventListener('click', () => { hideCard(); showDetails(disc); });
  }
}

function queueCard(disc, item) {
  hideCard();
  hoverDisc = disc.id;
  hoverTimer = setTimeout(() => {
    if (state.phase === 'inserting' || state.focused) return;
    tooltip.style.setProperty('--card-accent', disc.accent);
    tooltip.innerHTML = `<div class="card-eyebrow"><span>COLLECTION / ${disc.number}</span><span>${disc.category === 'china' ? 'CN · 国产' : 'OS EXPLORER'}</span></div><h3>${disc.name}</h3><p class="card-subtitle">${disc.subtitle}</p><p class="card-description">${disc.description}</p><div class="card-stats"><div><small>镜像体积</small><strong>${disc.size}</strong></div><div><small>${disc.ready ? '本次分配内存' : '体验内存'}</small><strong>${disc.ram}</strong></div></div><div class="card-quest"><b>✳ 探索小任务</b>${disc.quest}</div><p class="card-footer"><span>${categories[disc.category].name}</span><span class="${disc.ready ? 'ready-tag' : 'planned-tag'}">${disc.ready ? '● 点击插入并启动' : '◌ 待接入 · 点击看介绍'}</span></p>`;
    tooltip.hidden = false;
    const rect = item.getBoundingClientRect();
    const width = tooltip.offsetWidth;
    const height = tooltip.offsetHeight;
    let left = rect.left - width - 19;
    if (left < 12) left = Math.min(window.innerWidth - width - 12, rect.right + 16);
    if (left + width > window.innerWidth - 12 || window.innerWidth <= 600) left = Math.max(12, (window.innerWidth - width) / 2);
    const top = Math.max(12, Math.min(rect.top - 60, window.innerHeight - height - 12));
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }, 220);
}

function hideCard() {
  clearTimeout(hoverTimer);
  tooltip.hidden = true;
  hoverDisc = null;
}

function showDetails(disc) {
  releaseInput();
  const isCurrent = state.disc?.id === disc.id;
  $('#details-content').innerHTML = `<div class="details-topline">DISC ARCHIVE / VOL. ${disc.number}</div><span class="details-category">${categories[disc.category].name} · ${disc.country}</span><h2 id="details-title">${disc.name}</h2><p class="dialog-lead">${disc.description}</p><div class="details-specs"><div><small>镜像体积</small><strong>${disc.size}</strong></div><div><small>体验内存${disc.ready ? '（本次分配）' : ''}</small><strong>${disc.ram}</strong></div></div><p>${disc.minimum}</p><div class="details-quest"><span>✳ 这一站，试试这个</span><p>${disc.quest}</p></div><p class="details-status">${disc.ready ? '真实系统已接入 · 浏览器中运行 · 本次会话不保存' : '收藏待接入 · 目前提供介绍，尚不能在这张桌子上启动'}</p>${state.emulator && !isCurrent && disc.ready ? '<p class="details-running-warning">换盘会结束当前会话，未保存的修改会丢失。</p>' : ''}<div class="details-bottom"><button class="primary-button" id="details-start" ${!disc.ready ? 'disabled' : ''}>${isCurrent ? '回到这个系统 ↗' : disc.ready ? '插入光盘，开始体验 →' : '等待接入运行'}</button><a href="${disc.official}" target="_blank" rel="noreferrer">访问官方网站 ↗</a></div>`;
  $('#details-dialog').showModal();
  $('#details-start').addEventListener('click', () => { $('#details-dialog').close(); boot(disc); });
}

function setFocus(focused) {
  state.focused = focused;
  room.classList.toggle('focused', focused);
  document.body.classList.toggle('session-focused', focused);
  for (const element of document.querySelectorAll('.site-header, .introduction, .site-footer')) element.inert = focused;
  $('#disc-library').inert = focused;
  $('#session-toolbar').hidden = !focused;
  $('#desk-focus-button').textContent = focused ? '回到桌面 ↙' : '走近电脑 ↗';
  $('#power-button').setAttribute('aria-label', focused ? '回到桌面' : '走近电脑');
  if (!focused) releaseInput();
  hideCard();
}

function fitStudio() {
  if (state.focused) return;
  const width = room.clientWidth;
  const height = room.clientHeight;
  const stacked = matchMedia('(max-width: 1000px), (max-aspect-ratio: 6/5)').matches;
  const archiveWidth = parseFloat(getComputedStyle(room).getPropertyValue('--archive-width'));
  const scale = stacked
    ? Math.min(.9, (width - 16) / 850)
    : Math.min(1.16, (height - 90) / 740, (width - archiveWidth - 220) / 850);
  workstation.style.setProperty('--desk-scale', String(Math.max(.32, scale)));
}

function setScene(scene) {
  document.documentElement.dataset.scene = scene;
  for (const button of document.querySelectorAll('.scene-controls [data-scene]')) {
    button.setAttribute('aria-pressed', String(button.dataset.scene === scene));
  }
  try { localStorage.setItem('vm-studio-scene', scene); } catch {}
}

function updateControls() {
  const exists = Boolean(state.emulator);
  $('#pause-button').hidden = !exists || !['running', 'paused'].includes(state.phase);
  $('#fullscreen-button').hidden = !exists || !['running', 'paused'].includes(state.phase);
  $('#eject-button').hidden = state.phase === 'idle';
  $('#pause-button').textContent = state.phase === 'paused' ? '▷ 继续' : 'Ⅱ 暂停';
  screen.classList.toggle('paused', state.phase === 'paused');
  $('#session-name').textContent = state.disc ? `${state.disc.name} / ${state.phase === 'paused' ? 'PAUSED' : ['running'].includes(state.phase) ? 'RUNNING' : 'LOADING'}` : '电脑已就绪';
}

async function dispose() {
  clearTimeout(errorTimer);
  clearTimeout(driveTimer);
  clearInterval(menuTimer);
  $('#drive').classList.remove('reading');
  releaseInput();
  const previous = state.emulator;
  state.emulator = null;
  if (previous) await previous.destroy();
  vmScreen.querySelector('canvas').style.display = 'none';
  vmScreen.querySelector('.vm-text').innerHTML = '';
  vmScreen.querySelector('.vm-text').style.cssText = '';
}

async function preflight(disc) {
  if (typeof window.V86 !== 'function') throw new Error('系统运行引擎未准备好。请按项目说明准备本地文件，然后刷新页面。');
  for (const url of [disc.image, '/vendor/v86/v86.wasm', '/vendor/v86/seabios.bin', '/vendor/v86/vgabios.bin']) {
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok || response.headers.get('content-type')?.includes('text/html')) throw new Error('这张光盘的本地文件尚未准备好。请查看项目启动说明。');
  }
}

async function animateInsertion(disc, source, token) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sourceRect = source?.getBoundingClientRect() || $('#disc-library').getBoundingClientRect();
  setFocus(true);
  if (reduce) return;
  await new Promise(resolve => setTimeout(resolve, 850));
  if (token !== state.token) return;
  const target = $('#drive').getBoundingClientRect();
  const flying = $('#flying-disc');
  document.body.append(flying);
  flying.style.display = 'block';
  flying.style.left = `${sourceRect.right - 80}px`;
  flying.style.top = `${sourceRect.top}px`;
  const dx = target.left + target.width / 2 - (sourceRect.right - 80) - 44;
  const dy = target.top - sourceRect.top - 25;
  const animation = flying.animate([
    { transform: 'translate(0,0) rotate(-25deg) scale(1)', opacity: 1 },
    { transform: `translate(${dx}px,${dy - 20}px) rotate(35deg) scale(.85)`, opacity: 1, offset: .65 },
    { transform: `translate(${dx}px,${dy}px) rotate(0deg) scale(1.3,.07)`, opacity: 0 },
  ], { duration: 800, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
  try { await animation.finished; } catch {}
  flying.style.display = 'none';
  animation.cancel();
}

async function boot(disc, source) {
  if (!disc.ready || ['loading', 'inserting'].includes(state.phase)) return;
  if (state.disc?.id === disc.id && state.emulator) { setFocus(true); return; }
  if (state.emulator) {
    showDetailsForSwitch(disc);
    return;
  }
  await startDisc(disc, source);
}

function showDetailsForSwitch(disc) {
  showDetails(disc);
  const button = $('#details-start');
  button.replaceWith(button.cloneNode(true));
  $('#details-start').textContent = '结束当前会话，换入这张光盘 →';
  $('#details-start').addEventListener('click', async () => { $('#details-dialog').close(); await startDisc(disc); });
}

async function startDisc(disc, source) {
  const token = ++state.token;
  state.phase = 'inserting';
  state.disc = disc;
  updateControls();
  $('#room-status').textContent = `正在放入 ${disc.name} 光盘…`;
  try {
    await dispose();
    if (token !== state.token) return;
    await preflight(disc);
    if (token !== state.token) return;
    await animateInsertion(disc, source, token);
    if (token !== state.token) return;
    state.phase = 'loading';
    state.absolutePointer = false;
    screen.classList.add('active');
    screenWidth = 640;
    screenHeight = 480;
    fitScreen();
    $('#boot-overlay').hidden = false;
    $('#boot-title').textContent = `正在读取 ${disc.name}`;
    $('#boot-detail').textContent = '电脑正在准备启动，本次会话不会保存修改。';
    $('#boot-progress').style.width = '0%';
    $('#drive').classList.add('reading');
    renderShelf();
    updateControls();
    const emulator = new window.V86({
      wasm_path: '/vendor/v86/v86.wasm',
      memory_size: disc.memory * 1024 * 1024,
      vga_memory_size: 8 * 1024 * 1024,
      screen_container: vmScreen,
      bios: { url: '/vendor/v86/seabios.bin' },
      vga_bios: { url: '/vendor/v86/vgabios.bin' },
      [disc.drive]: { url: disc.image },
      boot_order: disc.drive === 'fda' ? 0x321 : 0x123,
      autostart: true,
    });
    state.emulator = emulator;
    emulator.keyboard_set_enabled(false);
    emulator.mouse_set_enabled(false);
    errorTimer = setTimeout(() => { if (state.phase === 'loading' && token === state.token) fail(new Error('光盘读取超时，可以弹出后重试。'), token); }, 45000);
    emulator.add_listener('download-progress', event => {
      if (token !== state.token || state.phase !== 'loading') return;
      const percent = event.total ? Math.round(event.loaded / event.total * 100) : 0;
      $('#boot-progress').style.width = `${percent}%`;
      $('#boot-detail').textContent = `${disc.name} · ${percent ? `${percent}%` : '正在读取文件…'}`;
    });
    emulator.add_listener('download-error', () => fail(new Error('光盘文件读取失败，请弹出后重新尝试。'), token));
    emulator.add_listener('emulator-ready', () => {
      if (token !== state.token) return;
      clearTimeout(errorTimer);
      emulator.keyboard_set_enabled(false);
      emulator.mouse_set_enabled(false);
      state.phase = 'running';
      $('#boot-overlay').hidden = true;
      $('#room-status').textContent = `${disc.name} 运行中 · 点击屏幕操作 · 本次会话不保存`;
      $('#drive').classList.remove('reading');
      updateControls();
      fitScreen();
      if (disc.id === 'tinycore') {
        let checks = 0;
        menuTimer = setInterval(() => {
          if (token !== state.token || ++checks > 120) { clearInterval(menuTimer); return; }
          if (vmScreen.innerText.includes('Press ENTER to boot')) {
            emulator.keyboard_send_scancodes([0x1c, 0x9c]);
            clearInterval(menuTimer);
            $('#room-status').textContent = 'Tiny Core 正在引导 · 启动后点击屏幕操作';
          }
        }, 250);
      }
    });
    emulator.add_listener('screen-set-size', dimensions => {
      if (token !== state.token) return;
      const [width, height, bpp] = dimensions;
      if (width > 0 && height > 0) {
        if (bpp === 0) {
          const context = document.createElement('canvas').getContext('2d');
          context.font = '16px monospace';
          screenWidth = Math.ceil(context.measureText('M').width * width);
          screenHeight = height * 16;
        } else {
          screenWidth = width;
          screenHeight = height;
          $('#room-status').textContent = `${disc.name} 运行中 · 点击屏幕操作 · 本次会话不保存`;
        }
      }
      fitScreen();
    });
    emulator.add_listener('vmware-absolute-mouse', enabled => { if (token === state.token) state.absolutePointer = enabled; });
    emulator.add_listener('ide-read-start', () => {
      if (token !== state.token) return;
      $('#drive').classList.add('reading');
      clearTimeout(driveTimer);
      driveTimer = setTimeout(() => $('#drive').classList.remove('reading'), 180);
    });
  } catch (error) { await fail(error, token); }
}

async function fail(error, token) {
  if (token !== state.token) return;
  console.error(error);
  state.phase = 'error';
  await dispose();
  if (token !== state.token) return;
  setFocus(true);
  screen.classList.add('active');
  $('#boot-overlay').hidden = false;
  $('#boot-title').textContent = '这次没能读到光盘';
  $('#boot-detail').textContent = error.message || '请弹出光盘后重试。';
  $('#boot-progress').style.width = '0%';
  $('#room-status').textContent = '读取失败 · 可以弹出光盘后重试';
  updateControls();
}

async function eject() {
  ++state.token;
  state.phase = 'idle';
  state.disc = null;
  $('#flying-disc').style.display = 'none';
  await dispose();
  screen.classList.remove('active', 'paused');
  $('#boot-overlay').hidden = true;
  $('#room-status').textContent = '光盘已弹出，电脑等待下一次旅行。';
  renderShelf();
  updateControls();
  setFocus(false);
}

function fitScreen() {
  const canvas = vmScreen.querySelector('canvas');
  if (canvas.style.display !== 'none' && canvas.width > 0 && canvas.height > 0) {
    screenWidth = canvas.width;
    screenHeight = canvas.height;
  }
  const padding = document.fullscreenElement === screen || state.focused ? 0 : 26;
  const scale = Math.min((screen.clientWidth - padding) / screenWidth, (screen.clientHeight - padding) / screenHeight);
  vmScreen.style.width = `${screenWidth}px`;
  vmScreen.style.height = `${screenHeight}px`;
  vmScreen.style.setProperty('--vm-scale', String(scale));
}

function releaseInput() {
  state.input = false;
  state.emulator?.keyboard_set_enabled(false);
  state.emulator?.mouse_set_enabled(false);
  if (document.pointerLockElement) document.exitPointerLock();
}

screen.addEventListener('pointerdown', () => {
  if (!state.focused) setFocus(true);
  if (state.phase !== 'running') return;
  state.input = true;
  screen.focus({ preventScroll: true });
  state.emulator?.keyboard_set_enabled(true);
  state.emulator?.mouse_set_enabled(true);
  if (!state.absolutePointer && !document.pointerLockElement && !matchMedia('(pointer: coarse)').matches) {
    Promise.resolve(state.emulator.lock_mouse()).catch(() => {
      $('#room-status').textContent = '再次点击屏幕可尝试捕获鼠标；键盘仍可操作。';
    });
  }
});
screen.addEventListener('contextmenu', event => { if (state.phase === 'running') event.preventDefault(); });
document.addEventListener('pointerdown', event => { if (!document.pointerLockElement && !screen.contains(event.target)) releaseInput(); }, true);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !state.input) hideCard();
  if (event.key === 'Tab' && state.input) { releaseInput(); }
});
window.addEventListener('blur', releaseInput);
window.addEventListener('scroll', hideCard, { passive: true });
window.addEventListener('resize', () => { hideCard(); fitScreen(); });
document.addEventListener('fullscreenchange', fitScreen);
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement) $('#room-status').textContent = `${state.disc?.name || '系统'} · 鼠标已进入电脑，按 Esc 释放 · 本次会话不保存`;
  else if (state.input && !state.absolutePointer) {
    releaseInput();
    $('#room-status').textContent = `${state.disc?.name || '系统'} · 鼠标已释放，点击屏幕可继续操作`;
  }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) releaseInput(); });
new ResizeObserver(fitScreen).observe(screen);
new ResizeObserver(fitScreen).observe(vmScreen.querySelector('canvas'));
new ResizeObserver(fitStudio).observe(room);
for (const button of document.querySelectorAll('.scene-controls [data-scene]')) {
  const label = `${button.textContent.trim()}工作室`;
  button.setAttribute('aria-label', label);
  button.title = label;
  button.addEventListener('click', () => setScene(button.dataset.scene));
}
setScene(document.documentElement.dataset.scene || 'day');

for (const button of document.querySelectorAll('[data-filter]')) button.addEventListener('click', () => {
  state.filter = button.dataset.filter;
  hideCard();
  for (const sibling of document.querySelectorAll('[data-filter]')) {
    const active = sibling === button;
    sibling.classList.toggle('active', active);
    sibling.setAttribute('aria-pressed', String(active));
  }
  renderShelf();
});

$('#desk-focus-button').addEventListener('click', () => setFocus(!state.focused));
$('#power-button').addEventListener('click', () => setFocus(!state.focused));
$('#back-button').addEventListener('click', () => setFocus(false));
$('#eject-button').addEventListener('click', eject);
$('#pause-button').addEventListener('click', async () => {
  if (!state.emulator) return;
  if (state.phase === 'running') {
    await state.emulator.stop();
    state.phase = 'paused';
    releaseInput();
    $('#room-status').textContent = `${state.disc.name} 已暂停 · 点击继续恢复`;
  } else if (state.phase === 'paused') {
    await state.emulator.run();
    state.phase = 'running';
    $('#room-status').textContent = `${state.disc.name} 运行中 · 点击屏幕操作 · 本次会话不保存`;
  }
  updateControls();
});
$('#fullscreen-button').addEventListener('click', async () => {
  try { if (!document.fullscreenElement) await screen.requestFullscreen(); else await document.exitFullscreen(); }
  catch { $('#room-status').textContent = '当前浏览器未允许全屏，可以继续在电脑中操作。'; }
});
$('#collection-button').addEventListener('click', () => { releaseInput(); hideCard(); $('#collection-dialog').showModal(); });
for (const dialog of document.querySelectorAll('dialog')) {
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
}
renderShelf();
updateControls();
fitStudio();
