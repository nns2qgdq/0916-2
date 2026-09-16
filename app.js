/**
 * Persona Clock - Logic and Interactive Controls
 * Features: High-precision real-time clock, personalized greetings,
 * editable user name with persistence, theme customization,
 * 12/24H formats, seconds progress bar, and Web Audio gentle chime.
 */

// Application State
const state = {
  userName: localStorage.getItem('persona_user_name') || 'Ryder',
  is24Hour: localStorage.getItem('persona_24h') !== 'false', // default true
  showSeconds: localStorage.getItem('persona_seconds') !== 'false', // default true
  theme: localStorage.getItem('persona_theme') || 'aurora',
  hourlyChime: localStorage.getItem('persona_chime') === 'true',
  startTime: Date.now(),
  lastChimedHour: -1
};

// DOM Elements
const elements = {
  userNameDisplay: document.getElementById('userNameDisplay'),
  editNameBtn: document.getElementById('editNameBtn'),
  nameEditorForm: document.getElementById('nameEditorForm'),
  nameInput: document.getElementById('nameInput'),
  saveNameBtn: document.getElementById('saveNameBtn'),
  cancelNameBtn: document.getElementById('cancelNameBtn'),
  
  hoursDisplay: document.getElementById('hoursDisplay'),
  minutesDisplay: document.getElementById('minutesDisplay'),
  secondsDisplay: document.getElementById('secondsDisplay'),
  colonOne: document.getElementById('colonOne'),
  colonTwo: document.getElementById('colonTwo'),
  periodDisplay: document.getElementById('periodDisplay'),
  secondProgressBar: document.getElementById('secondProgressBar'),
  timeWrapper: document.getElementById('timeWrapper'),

  greetingBadge: document.getElementById('greetingBadge'),
  greetingIcon: document.getElementById('greetingIcon'),
  greetingText: document.getElementById('greetingText'),
  salutationPrefix: document.getElementById('salutationPrefix'),
  subtitleMessage: document.getElementById('subtitleMessage'),

  fullDateDisplay: document.getElementById('fullDateDisplay'),
  dayOfWeekDisplay: document.getElementById('dayOfWeekDisplay'),
  timezoneDisplay: document.getElementById('timezoneDisplay'),

  themeToggleBtn: document.getElementById('themeToggleBtn'),
  themeMenu: document.getElementById('themeMenu'),
  themeOptions: document.querySelectorAll('.theme-opt'),
  
  formatToggleBtn: document.getElementById('formatToggleBtn'),
  formatLabel: document.getElementById('formatLabel'),
  
  fullscreenBtn: document.getElementById('fullscreenBtn'),
  secToggle: document.getElementById('secToggle'),
  chimeToggle: document.getElementById('chimeToggle'),
  uptimeCounter: document.getElementById('uptimeCounter')
};

// ============================================================================
// Time & Date Engine
// ============================================================================

const dayNamesZh = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

function updateClock() {
  const now = new Date();
  const rawHours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const millis = now.getMilliseconds();

  // 12H vs 24H formatting
  let displayHours = rawHours;
  if (!state.is24Hour) {
    displayHours = rawHours % 12 || 12;
    elements.periodDisplay.textContent = rawHours >= 12 ? 'PM' : 'AM';
    elements.periodDisplay.classList.remove('hidden');
  } else {
    elements.periodDisplay.classList.add('hidden');
  }

  // Update digits
  elements.hoursDisplay.textContent = String(displayHours).padStart(2, '0');
  elements.minutesDisplay.textContent = String(minutes).padStart(2, '0');
  elements.secondsDisplay.textContent = String(seconds).padStart(2, '0');

  // Second progress bar (smooth interpolation using milliseconds)
  const progressPercent = ((seconds + millis / 1000) / 60) * 100;
  elements.secondProgressBar.style.width = `${progressPercent}%`;

  // Update Greetings based on time of day
  updateGreeting(rawHours);

  // Check for hourly chime
  if (state.hourlyChime && minutes === 0 && seconds === 0 && state.lastChimedHour !== rawHours) {
    playGentleChime();
    state.lastChimedHour = rawHours;
  }

  // Update Page Uptime Counter
  updateUptime();

  requestAnimationFrame(updateClock);
}

function updateGreeting(hours) {
  let icon = '☀️';
  let text = '早安，美好的一天開始了';
  let prefix = '早安，';
  let subMsg = '保持專注與熱情，今天將充滿無限可能。';

  if (hours >= 0 && hours < 5) {
    icon = '🌙';
    text = '夜深了 · 萬籟俱寂';
    prefix = '夜深了，';
    subMsg = '夜深了，請注意適時休息，放鬆身心。';
  } else if (hours >= 5 && hours < 9) {
    icon = '🌅';
    text = '清晨好 · 朝陽初昇';
    prefix = '清晨好，';
    subMsg = '呼吸清晨新鮮空氣，迎接精彩充實的一天。';
  } else if (hours >= 9 && hours < 12) {
    icon = '☀️';
    text = '上午好 · 效率黃金時段';
    prefix = '上午好，';
    subMsg = '思緒清晰、精力充沛，盡情發揮創造力吧！';
  } else if (hours >= 12 && hours < 14) {
    icon = '🥪';
    text = '午安 · 享受午餐與放鬆';
    prefix = '午安，';
    subMsg = '別忘了享用美味午餐，小憩片刻補充活力。';
  } else if (hours >= 14 && hours < 18) {
    icon = '☕';
    text = '下午好 · 專注衝刺時刻';
    prefix = '下午好，';
    subMsg = '來杯咖啡或好茶，穩步推進各項任務目標。';
  } else if (hours >= 18 && hours < 22) {
    icon = '🌆';
    text = '傍晚好 · 華燈初上';
    prefix = '晚安，';
    subMsg = '結束了白天的辛勞，享受屬於自己的美好時光。';
  } else {
    icon = '✨';
    text = '晚安 · 舒緩放鬆時刻';
    prefix = '晚安，';
    subMsg = '卸下一天的疲憊，願您擁有舒適安穩的夜晚。';
  }

  elements.greetingIcon.textContent = icon;
  elements.greetingText.textContent = text;
  elements.salutationPrefix.textContent = prefix;
  elements.subtitleMessage.textContent = subMsg;
}

function updateCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const dayIndex = now.getDay();

  elements.fullDateDisplay.textContent = `${year}年${month}月${date}日`;
  elements.dayOfWeekDisplay.textContent = dayNamesZh[dayIndex];

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Taipei';
    const offsetHours = -now.getTimezoneOffset() / 60;
    const offsetStr = `GMT${offsetHours >= 0 ? '+' : ''}${offsetHours}`;
    elements.timezoneDisplay.textContent = `${tz} (${offsetStr})`;
  } catch {
    elements.timezoneDisplay.textContent = 'Asia/Taipei';
  }
}

function updateUptime() {
  const elapsedSec = Math.floor((Date.now() - state.startTime) / 1000);
  const minutes = Math.floor(elapsedSec / 60);
  const seconds = elapsedSec % 60;
  if (minutes > 0) {
    elements.uptimeCounter.textContent = `頁面運行時間：${minutes} 分 ${seconds} 秒`;
  } else {
    elements.uptimeCounter.textContent = `頁面運行時間：${seconds} 秒`;
  }
}

// ============================================================================
// Web Audio Gentle Chime
// ============================================================================

function playGentleChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 harmonic triad
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + idx * 0.12 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.12 + 1.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 1.6);
    });
  } catch (err) {
    console.warn('Audio playback not permitted or supported:', err);
  }
}

// ============================================================================
// Name Management (Interactive Editing & LocalStorage)
// ============================================================================

function setupNameEditor() {
  elements.userNameDisplay.textContent = state.userName;

  function openEditor() {
    elements.nameInput.value = state.userName;
    elements.userNameDisplay.parentElement.style.display = 'none';
    elements.nameEditorForm.classList.remove('hidden');
    elements.nameInput.focus();
    elements.nameInput.select();
  }

  function closeEditor() {
    elements.userNameDisplay.parentElement.style.display = 'inline-flex';
    elements.nameEditorForm.classList.add('hidden');
  }

  function saveName(e) {
    if (e) e.preventDefault();
    const newName = elements.nameInput.value.trim();
    if (newName) {
      state.userName = newName;
      elements.userNameDisplay.textContent = newName;
      localStorage.setItem('persona_user_name', newName);
    }
    closeEditor();
  }

  elements.userNameDisplay.addEventListener('click', openEditor);
  elements.editNameBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openEditor();
  });

  elements.nameEditorForm.addEventListener('submit', saveName);
  elements.cancelNameBtn.addEventListener('click', closeEditor);

  elements.nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeEditor();
  });
}

// ============================================================================
// Theme Selector
// ============================================================================

function applyTheme(themeName) {
  state.theme = themeName;
  document.body.setAttribute('data-theme', themeName);
  localStorage.setItem('persona_theme', themeName);

  elements.themeOptions.forEach(opt => {
    opt.classList.toggle('active', opt.dataset.themeVal === themeName);
  });
}

function setupThemeMenu() {
  applyTheme(state.theme);

  elements.themeToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    elements.themeMenu.classList.toggle('open');
  });

  elements.themeOptions.forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const themeVal = opt.dataset.themeVal;
      applyTheme(themeVal);
      elements.themeMenu.classList.remove('open');
    });
  });

  document.addEventListener('click', (e) => {
    if (!elements.themeSelectorWrap?.contains(e.target)) {
      elements.themeMenu.classList.remove('open');
    }
  });
}

// ============================================================================
// Format & Preferences Toggles
// ============================================================================

function setupPreferences() {
  // 12/24H format button
  elements.formatLabel.textContent = state.is24Hour ? '24H' : '12H';
  elements.formatToggleBtn.addEventListener('click', () => {
    state.is24Hour = !state.is24Hour;
    elements.formatLabel.textContent = state.is24Hour ? '24H' : '12H';
    localStorage.setItem('persona_24h', state.is24Hour);
  });

  // Seconds display toggle
  elements.secToggle.checked = state.showSeconds;
  document.body.classList.toggle('hide-seconds', !state.showSeconds);
  elements.secToggle.addEventListener('change', () => {
    state.showSeconds = elements.secToggle.checked;
    document.body.classList.toggle('hide-seconds', !state.showSeconds);
    localStorage.setItem('persona_seconds', state.showSeconds);
  });

  // Chime toggle
  elements.chimeToggle.checked = state.hourlyChime;
  elements.chimeToggle.addEventListener('change', () => {
    state.hourlyChime = elements.chimeToggle.checked;
    localStorage.setItem('persona_chime', state.hourlyChime);
    if (state.hourlyChime) {
      playGentleChime(); // Preview chime tone on activation
    }
  });

  // Fullscreen mode toggle
  elements.fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      document.body.classList.add('fullscreen-mode');
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      document.body.classList.remove('fullscreen-mode');
    }
  });

  document.addEventListener('fullscreenchange', () => {
    document.body.classList.toggle('fullscreen-mode', !!document.fullscreenElement);
  });
}

// ============================================================================
// Initialization
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  setupNameEditor();
  setupThemeMenu();
  setupPreferences();
  updateCalendar();
  updateClock();

  // Re-verify date at every midnight
  setInterval(updateCalendar, 60000);
});
