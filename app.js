/* ============================================================
   MUTABA'AH YAUMIYAH — SPA Application
   ============================================================ */

const STORAGE_KEY = 'mutabaah_data_v1';

// ===== DEFAULT STATE =====
const DEFAULT_AMALAN = [
  { id: 'sholat_subuh', text: 'Sholat Subuh berjamaah', done: false },
  { id: 'sholat_dzuhur', text: 'Sholat Dzuhur berjamaah', done: false },
  { id: 'sholat_ashar', text: 'Sholat Ashar berjamaah', done: false },
  { id: 'sholat_maghrib', text: 'Sholat Maghrib berjamaah', done: false },
  { id: 'sholat_isya', text: 'Sholat Isya berjamaah', done: false },
  { id: 'tahajud', text: 'Sholat Tahajud', done: false },
  { id: 'dhuha', text: 'Sholat Dhuha', done: false },
  { id: 'quran', text: "Baca Al-Qur'an", done: false },
  { id: 'dzikir_pagi', text: 'Dzikir Pagi', done: false },
  { id: 'dzikir_petang', text: 'Dzikir Petang', done: false },
  { id: 'sedekah', text: 'Sedekah', done: false },
  { id: 'istighfar', text: 'Istighfar 100x', done: false },
  { id: 'sholawat', text: 'Sholawat 100x', done: false },
  { id: 'olahraga', text: 'Olahraga / Jalan Sehat', done: false },
];

const MOTIVASI = [
  '"Sebaik-baik amal adalah yang dilakukan terus-menerus." (HR. Bukhari)',
  '"Barangsiapa beriman kepada Allah dan hari akhir, hendaklah ia berkata baik atau diam." (HR. Bukhari)',
  '"Sesungguhnya sholat itu mencegah dari perbuatan keji dan mungkar." (QS. Al-Ankabut: 45)',
  '"Janganlah kamu berputus asa dari rahmat Allah." (QS. Az-Zumar: 53)',
  '"Dan barangsiapa bertakwa kepada Allah, niscaya Dia akan mengadakan jalan keluar baginya." (QS. At-Talaq: 2)',
  '"Hari ini lebih baik dari kemarin, besok lebih baik dari hari ini."',
];

// ===== STATE MANAGEMENT =====
let state = {
  user: { name: 'Hamba Allah', joinDate: new Date().toISOString() },
  amalan: [],
  history: {}, // { "2025-01-01": { done: 5, total: 12 } }
  theme: 'light',
  city: 'Jakarta',
  prayerTimes: {},
  reminder: true,
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = { ...state, ...parsed };
      // Reset amalan harian jika tanggal berbeda
      const today = getTodayKey();
      if (state.lastDate !== today) {
        state.amalan = DEFAULT_AMALAN.map(a => ({ ...a, done: false }));
        state.lastDate = today;
      }
    } else {
      state.amalan = DEFAULT_AMALAN.map(a => ({ ...a }));
      state.lastDate = getTodayKey();
    }
  } catch (e) {
    console.error('Load error:', e);
    state.amalan = DEFAULT_AMALAN.map(a => ({ ...a }));
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Save error:', e);
  }
}

// ===== HELPERS =====
function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatDateID(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m-1, d);
  return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function getHijriDate() {
  try {
    return new Date().toLocaleDateString('id-ID-u-ca-islamic-umalqura', {
      day: 'numeric', month: 'long', year: 'numeric'
    }) + ' H';
  } catch {
    return 'Tanggal Hijriyah';
  }
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ===== RENDER FUNCTIONS =====
function renderHeader() {
  document.getElementById('hijriDate').textContent = getHijriDate();
}

function renderGreeting() {
  const hour = new Date().getHours();
  let sapaan = 'Selamat pagi';
  if (hour >= 11 && hour < 15) sapaan = 'Selamat siang';
  else if (hour >= 15 && hour < 18) sapaan = 'Selamat sore';
  else if (hour >= 18) sapaan = 'Selamat malam';

  const motivasi = MOTIVASI[Math.floor(Math.random() * MOTIVASI.length)];
  document.getElementById('userName').textContent = state.user.name;
  document.getElementById('motivasi').textContent = motivasi;
}

function renderProgress() {
  const total = state.amalan.length;
  const done = state.amalan.filter(a => a.done).length;
  const percent = total ? Math.round((done / total) * 100) : 0;

  // Update ring
  const ring = document.getElementById('ringProgress');
  const circumference = 2 * Math.PI * 85; // r=85
  ring.style.strokeDasharray = circumference;
  ring.style.strokeDashoffset = circumference - (percent / 100) * circumference;

  document.getElementById('progressPercent').textContent = percent + '%';
  document.getElementById('statDone').textContent = done;
  document.getElementById('statPending').textContent = total - done;
  document.getElementById('statStreak').textContent = calculateStreak();

  // Save history hari ini
  const today = getTodayKey();
  state.history[today] = { done, total };
}

function calculateStreak() {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const h = state.history[key];
    if (h && h.total > 0 && h.done / h.total >= 0.5) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

function renderPrayerTimes() {
  const container = document.getElementById('prayerTimes');
  const times = state.prayerTimes;
  const order = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const names = { Fajr: 'Subuh', Dhuhr: 'Dzuhur', Asr: 'Ashar', Maghrib: 'Maghrib', Isha: 'Isya' };

  if (!times || !times.Fajr) {
    container.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);font-size:13px;padding:16px;">Memuat jadwal sholat...</p>';
    return;
  }

  // Tentukan sholat aktif
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  let activePrayer = null;
  const prayerMinutes = order.map(p => {
    const [h, m] = times[p].split(':').map(Number);
    return { name: p, minutes: h * 60 + m };
  });
  for (let i = prayerMinutes.length - 1; i >= 0; i--) {
    if (currentMinutes >= prayerMinutes[i].minutes) {
      activePrayer = prayerMinutes[i].name;
      break;
    }
  }
  if (!activePrayer) activePrayer = 'Isha'; // sebelum subuh

  container.innerHTML = order.map(p => `
    <div class="prayer-item ${p === activePrayer ? 'active' : ''}">
      <span class="prayer-name">${names[p]}</span>
      <span class="prayer-time">${times[p]}</span>
    </div>
  `).join('');
}

function renderAmalan() {
  const container = document.getElementById('amalanList');
  container.innerHTML = state.amalan.map(a => `
    <div class="amalan-item ${a.done ? 'done' : ''}" data-id="${a.id}">
      <div class="checkbox">${a.done ? '✓' : ''}</div>
      <span class="amalan-text">${escapeHTML(a.text)}</span>
      <button class="amalan-delete" data-delete="${a.id}" title="Hapus">🗑️</button>
    </div>
  `).join('');

  // Event listeners
  container.querySelectorAll('.amalan-item').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.dataset.delete) return;
      toggleAmalan(el.dataset.id);
    });
  });
  container.querySelectorAll('.amalan-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteAmalan(btn.dataset.delete);
    });
  });
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderHistory() {
  const container = document.getElementById('historyList');
  const entries = Object.entries(state.history)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 30);

  if (entries.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">Belum ada riwayat</p>';
    return;
  }

  container.innerHTML = entries.map(([date, data]) => {
    const percent = data.total ? Math.round((data.done / data.total) * 100) : 0;
    const emoji = percent >= 80 ? '🌟' : percent >= 50 ? '👍' : '📝';
    return `
      <div class="history-item">
        <div class="history-date">${emoji} ${formatDateID(date)}</div>
        <div class="history-stat">${data.done} dari ${data.total} amalan selesai (${percent}%)</div>
      </div>
    `;
  }).join('');
}

function renderProfile() {
  document.getElementById('profileName').textContent = state.user.name;
  document.getElementById('joinDate').textContent = formatDateID(state.user.joinDate.split('T')[0]);
  document.getElementById('citySelect').value = state.city;
  document.getElementById('darkModeSwitch').checked = state.theme === 'dark';
  document.getElementById('reminderSwitch').checked = state.reminder;
}

function renderChart() {
  const ctx = document.getElementById('weeklyChart');
  if (!ctx) return;

  // Build 7 hari terakhir
  const labels = [];
  const data = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const dayName = d.toLocaleDateString('id-ID', { weekday: 'short' });
    labels.push(dayName);
    const h = state.history[key];
    data.push(h && h.total ? Math.round((h.done / h.total) * 100) : 0);
  }

  // Destroy existing
  if (window._chart) window._chart.destroy();
  const isDark = state.theme === 'dark';
  window._chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Persentase Ibadah',
        data,
        backgroundColor: 'rgba(20, 184, 166, 0.7)',
        borderColor: 'rgba(15, 118, 110, 1)',
        borderWidth: 2,
        borderRadius: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => `${c.parsed.y}% amalan selesai`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { color: isDark ? '#94a3b8' : '#64748b', callback: (v) => v + '%' },
          grid: { color: isDark ? '#334155' : '#e2e8f0' }
        },
        x: {
          ticks: { color: isDark ? '#94a3b8' : '#64748b' },
          grid: { display: false }
        }
      }
    }
  });
}

// ===== ACTIONS =====
function toggleAmalan(id) {
  const amalan = state.amalan.find(a => a.id === id);
  if (!amalan) return;
  amalan.done = !amalan.done;

  if (amalan.done) {
    showToast(`✅ ${amalan.text} selesai!`);
    // Vibrate
    if (navigator.vibrate) navigator.vibrate(50);
  }

  saveState();
  renderProgress();
  renderAmalan();
  renderChart();
}

function deleteAmalan(id) {
  if (!confirm('Hapus amalan ini?')) return;
  state.amalan = state.amalan.filter(a => a.id !== id);
  saveState();
  renderProgress();
  renderAmalan();
  renderChart();
  showToast('Amalan dihapus');
}

function addAmalan(text) {
  if (!text.trim()) return;
  state.amalan.push({
    id: 'custom_' + Date.now(),
    text: text.trim(),
    done: false,
  });
  saveState();
  renderProgress();
  renderAmalan();
  showToast('✅ Amalan ditambahkan');
}

// ===== API PRAYER TIMES =====
async function fetchPrayerTimes(city) {
  const cities = {
    Jakarta: { lat: -6.2088, lng: 106.8456 },
    Bandung: { lat: -6.9175, lng: 107.6191 },
    Surabaya: { lat: -7.2575, lng: 112.7521 },
    Yogyakarta: { lat: -7.7971, lng: 110.3707 },
    Medan: { lat: 3.5952, lng: 98.6722 },
    Makassar: { lat: -5.1477, lng: 119.4327 },
  };
  const coords = cities[city] || cities.Jakarta;
  const today = new Date();
  const dateStr = `${String(today.getDate()).padStart(2,'0')}-${String(today.getMonth()+1).padStart(2,'0')}-${today.getFullYear()}`;

  try {
    const res = await fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${coords.lat}&longitude=${coords.lng}&method=11`);
    const json = await res.json();
    if (json.code === 200) {
      const t = json.data.timings;
      state.prayerTimes = {
        Fajr: t.Fajr.slice(0,5),
        Dhuhr: t.Dhuhr.slice(0,5),
        Asr: t.Asr.slice(0,5),
        Maghrib: t.Maghrib.slice(0,5),
        Isha: t.Isha.slice(0,5),
      };
      saveState();
      renderPrayerTimes();
    }
  } catch (e) {
    console.error('Prayer times error:', e);
    // Fallback statis
    state.prayerTimes = { Fajr: '04:45', Dhuhr: '12:00', Asr: '15:15', Maghrib: '18:00', Isha: '19:15' };
    renderPrayerTimes();
  }
}

// ===== THEME =====
function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('themeToggle').textContent = theme === 'dark' ? '☀️' : '🌙';
  document.getElementById('darkModeSwitch').checked = theme === 'dark';
  saveState();
  if (window._chart) renderChart();
}

// ===== NAVIGATION =====
function switchView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === view));
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (view === 'history') renderHistory();
  if (view === 'profile') renderProfile();
  if (view === 'dashboard') setTimeout(renderChart, 50);
}

// ===== EVENT BINDINGS =====
function bindEvents() {
  // Bottom nav
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', () => {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  });
  document.getElementById('darkModeSwitch').addEventListener('change', (e) => {
    applyTheme(e.target.checked ? 'dark' : 'light');
  });

  // Add amalan modal
  const modal = document.getElementById('modalAmalan');
  document.getElementById('addAmalanBtn').addEventListener('click', () => {
    modal.classList.remove('hidden');
    document.getElementById('newAmalanInput').focus();
  });
  document.getElementById('cancelAddAmalan').addEventListener('click', () => {
    modal.classList.add('hidden');
    document.getElementById('newAmalanInput').value = '';
  });
  document.getElementById('confirmAddAmalan').addEventListener('click', () => {
    const val = document.getElementById('newAmalanInput').value;
    addAmalan(val);
    document.getElementById('newAmalanInput').value = '';
    modal.classList.add('hidden');
  });
  document.getElementById('newAmalanInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('confirmAddAmalan').click();
  });

  // City change
  document.getElementById('citySelect').addEventListener('change', (e) => {
    state.city = e.target.value;
    document.getElementById('cityLabel').textContent = state.city;
    saveState();
    showToast('📍 Memuat jadwal sholat ' + state.city);
    fetchPrayerTimes(state.city);
  });

  // Reminder
  document.getElementById('reminderSwitch').addEventListener('change', (e) => {
    state.reminder = e.target.checked;
    saveState();
    if (e.target.checked && 'Notification' in window) {
      Notification.requestPermission();
    }
  });

  // Edit name
  document.getElementById('editNameBtn').addEventListener('click', () => {
    const newName = prompt('Masukkan nama Anda:', state.user.name);
    if (newName && newName.trim()) {
      state.user.name = newName.trim();
      saveState();
      renderGreeting();
      renderProfile();
      showToast('Nama diperbarui');
    }
  });

  // Export
  document.getElementById('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mutabaah-${getTodayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data berhasil di-export');
  });

  // Reset
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!confirm('⚠️ Yakin ingin menghapus semua data? Tindakan ini tidak bisa dibatalkan!')) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });
}

// ===== INIT =====
async function init() {
  loadState();
  applyTheme(state.theme);

  // Hide loader
  setTimeout(() => {
    document.getElementById('loader').style.opacity = '0';
    setTimeout(() => {
      document.getElementById('loader').classList.add('hidden');
      document.getElementById('app').classList.remove('hidden');
    }, 500);
  }, 1200);

  // Render
  renderHeader();
  renderGreeting();
  renderProgress();
  renderAmalan();
  document.getElementById('cityLabel').textContent = state.city;

  bindEvents();

  // Fetch prayer times
  if (!state.prayerTimes || !state.prayerTimes.Fajr) {
    await fetchPrayerTimes(state.city);
  } else {
    renderPrayerTimes();
  }

  // Chart
  setTimeout(renderChart, 300);

  // Auto-refresh at midnight
  scheduleMidnightReset();

  // Save today's history
  saveState();
}

function scheduleMidnightReset() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const ms = midnight - now;
  setTimeout(() => {
    location.reload();
  }, ms);
}

// Start
document.addEventListener('DOMContentLoaded', init);