// ==========================================
// 1. KONFIGURASI SUPABASE
// ==========================================
const SUPABASE_URL = 'https://nvfdctzpdibztejwrgyr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52ZmRjdHpwZGlienRlandyZ3lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ1MzU1NDMsImV4cCI6MjExMDExMTU0M30.A91GHmt6Z4T-LVf69pHLB7_Vpsj3rnFSImOuI4xWVcU';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// 2. STATE & VARIABEL GLOBAL
// ==========================================
const DEFAULT_AMALAN = [
    "Qiyamullail", "Shalat Witir", "Tilawah Al-Qur'an 1 Juz", "Baca Terjemah Al-Qur'an", 
    "Mendo'akan Palestina", "Mendo'akan Qiyadah & Jamaah PKS", "Istighfar 100x", 
    "Shalawat 100x", "Infaq", "Shalat Dhuha", "Shalat 5 Waktu Berjamaah", "Olahraga 30 Menit"
];

const ICONS = {
    check: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>`,
    progress: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
    bookmark: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>`,
    droplet: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>`,
    x: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>`,
    trash: `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>`
};

const STATUS = [
    { id: 'kholas', label: 'Kholas 1 Juz', icon: ICONS.check, color: '#059669', bg: '#ecfdf5' },
    { id: 'progress', label: 'In Progress', icon: ICONS.progress, color: '#d97706', bg: '#fffbeb' },
    { id: 'tidak-laporan', label: 'Tidak Laporan', icon: ICONS.bookmark, color: '#db2777', bg: '#fdf2f8' },
    { id: 'kurang', label: 'Kurang 1 Juz', icon: ICONS.droplet, color: '#475569', bg: '#f8fafc' },
    { id: 'tidak-tilawah', label: 'Tidak Tilawah', icon: ICONS.x, color: '#dc2626', bg: '#fef2f2' },
];

let currentUser = null;
let currentProfile = null;
let targetUserId = null; 
let targetUserName = null;
let currentDate = new Date();
let currentData = {}; 
let tilawahDate = new Date(); 
let allMutabaahData = []; 
let activeEditDate = null;
let chartBarInstance = null;
let chartDonutInstance = null;

// ==========================================
// 3. AUTHENTICATION & LOCAL STORAGE
// ==========================================
async function checkAuth() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    if (error || !session) {
        document.getElementById('authScreen').classList.remove('hidden');
        return;
    }

    currentUser = session.user;
    
    const savedTargetId = localStorage.getItem('lastTargetUserId');
    const savedTargetName = localStorage.getItem('lastTargetUserName');

    if (savedTargetId && savedTargetName) {
        targetUserId = savedTargetId;
        targetUserName = savedTargetName;
    } else {
        targetUserId = currentUser.id; 
    }
    
    await fetchProfile();
    document.getElementById('authScreen').classList.add('hidden');
    renderTilawah(); 
    renderMutabaah();
    buildSheetOptions();
    renderMemberDropdownList(); 
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errEl = document.getElementById('authError');
    errEl.classList.add('hidden');

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
        errEl.textContent = error.message;
        errEl.classList.remove('hidden');
    } else {
        checkAuth();
    }
}

async function handleRegister() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errEl = document.getElementById('authError');
    errEl.classList.add('hidden');

    const fullName = prompt("Masukkan Nama Lengkap Anda:"); 
    if(!fullName) return;

    const { error } = await supabaseClient.auth.signUp({ 
        email, password, options: { data: { full_name: fullName } }
    });

    if (error) {
        errEl.textContent = error.message;
        errEl.classList.remove('hidden');
    } else {
        alert('Registrasi berhasil! Silakan login.');
    }
}

async function handleLogout() {
    await supabaseClient.auth.signOut();
    localStorage.removeItem('lastTargetUserId');
    localStorage.removeItem('lastTargetUserName');

    currentUser = null;
    currentProfile = null;
    targetUserId = null;
    targetUserName = null;
    document.getElementById('authScreen').classList.remove('hidden');
}

async function fetchProfile() {
    if (!currentUser) return;

    const { data, error } = await supabaseClient
        .from('profiles').select('*').eq('id', currentUser.id).maybeSingle();

    if (data) {
        currentProfile = data;
        document.getElementById('sidebarUserName').textContent = data.full_name || currentUser.email;
    } else {
        currentProfile = { full_name: currentUser.email.split('@')[0] };
        document.getElementById('sidebarUserName').textContent = currentProfile.full_name;
    }
    
    updateUIBasedOnTarget();
}

function updateUIBasedOnTarget() {
    const nameDisplay = targetUserId === currentUser.id ? currentProfile.full_name : targetUserName;
    
    document.getElementById('userNameDisplay').textContent = nameDisplay;
    document.getElementById('streakName').textContent = nameDisplay;
    document.getElementById('rekapTargetName').textContent = nameDisplay;
    document.getElementById('currentMemberBtnText').textContent = nameDisplay;
    document.getElementById('currentMemberBtnTextMobile').textContent = nameDisplay;
}

// ==========================================
// 4. FITUR SWITCH ANGGOTA (DROPDOWN)
// ==========================================

// Perbaikan: Fungsi ini sekarang langsung membuka dropdown yang tepat
function toggleMemberDropdown() {
    const dropdownDesktop = document.getElementById('memberDropdown');
    const dropdownMobile = document.getElementById('memberDropdownMobile');
    
    // Cek lebar layar untuk menentukan dropdown mana yang harus dibuka
    const isMobile = window.innerWidth < 768; // 768px adalah breakpoint 'md' di Tailwind

    if (isMobile) {
        if (dropdownMobile) dropdownMobile.classList.toggle('hidden');
        if (dropdownDesktop) dropdownDesktop.classList.add('hidden'); // Pastikan desktop tertutup
    } else {
        if (dropdownDesktop) dropdownDesktop.classList.toggle('hidden');
        if (dropdownMobile) dropdownMobile.classList.add('hidden'); // Pastikan mobile tertutup
    }

    // Render isi list dropdown
    if ((dropdownDesktop && !dropdownDesktop.classList.contains('hidden')) || 
        (dropdownMobile && !dropdownMobile.classList.contains('hidden'))) {
        renderMemberDropdownList();
    }
}

async function renderMemberDropdownList() {
    const listDesktop = document.getElementById('memberDropdownList');
    const listMobile = document.getElementById('memberDropdownListMobile');
    
    const loadingHtml = '<div class="text-xs text-slate-500 p-2 text-center">Memuat...</div>';
    if(listDesktop) listDesktop.innerHTML = loadingHtml;
    if(listMobile) listMobile.innerHTML = loadingHtml;

    const { data, error } = await supabaseClient.from('profiles').select('id, full_name');

    if (error || !data || data.length === 0) {
        const errorHtml = '<div class="text-xs text-slate-500 p-2 text-center">Belum ada anggota</div>';
        if(listDesktop) listDesktop.innerHTML = errorHtml;
        if(listMobile) listMobile.innerHTML = errorHtml;
        return;
    }

    data.sort((a, b) => {
        if (a.id === currentUser.id) return -1;
        if (b.id === currentUser.id) return 1;
        return a.full_name.localeCompare(b.full_name);
    });

    const generateHtml = (m) => {
        const isSelected = targetUserId === m.id;
        return `
            <button onclick="switchMember('${m.id}', '${m.full_name}')" class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition ${isSelected ? 'bg-brand-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'}">
                <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isSelected ? 'bg-white text-brand-600' : 'bg-brand-100 text-brand-600'}">
                        ${m.full_name ? m.full_name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <span class="text-xs font-bold truncate">${m.full_name || 'User'} ${m.id === currentUser.id ? '(Anda)' : ''}</span>
                </div>
                ${isSelected ? '<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>' : ''}
            </button>
        `;
    };

    if(listDesktop) listDesktop.innerHTML = data.map(generateHtml).join('');
    if(listMobile) listMobile.innerHTML = data.map(generateHtml).join('');
}

function switchMember(id, name) {
    targetUserId = id;
    targetUserName = name;
    
    localStorage.setItem('lastTargetUserId', id);
    localStorage.setItem('lastTargetUserName', name);
    
    // Sembunyikan kedua dropdown
    document.getElementById('memberDropdown').classList.add('hidden');
    document.getElementById('memberDropdownMobile').classList.add('hidden');
    
    updateUIBasedOnTarget();
    renderMutabaah();
    renderTilawah();
    
    if (!document.getElementById('view-rekap').classList.contains('hidden')) {
        renderRekap();
    }
    
    showToast(`Beralih ke data: ${name}`, 'success');
}

// Event listener menutup dropdown jika klik di luar area
document.addEventListener('click', function(event) {
    const ddDesktop = document.getElementById('memberDropdown');
    const ddMobile = document.getElementById('memberDropdownMobile');
    
    // Cek apakah yang diklik adalah tombol pembuka (di desktop atau mobile)
    const isBtnClick = event.target.closest('button[onclick="toggleMemberDropdown()"]');
    
    // Jika yang diklik BUKAN tombol dropdown, dan BUKAN area dropdown itu sendiri, maka tutup.
    if (!isBtnClick) {
        if (ddDesktop && !ddDesktop.contains(event.target)) ddDesktop.classList.add('hidden');
        if (ddMobile && !ddMobile.contains(event.target)) ddMobile.classList.add('hidden');
    }
});

// ==========================================
// 5. LOGIKA TILAWAH
// ==========================================
function formatDateKey(dateObj) {
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2,'0')}-${String(dateObj.getDate()).padStart(2,'0')}`;
}

async function fetchAllMutabaahForTilawah() {
    if (!targetUserId) return;
    const firstDay = new Date(tilawahDate.getFullYear(), tilawahDate.getMonth() - 5, 1);
    const { data, error } = await supabaseClient
        .from('mutabaah').select('date, amalan_data, tilawah_status')
        .eq('user_id', targetUserId) 
        .gte('date', formatDateKey(firstDay));
    
    if (!error) {
        allMutabaahData = data || [];
    }
}

function getTilawahStatus(dateStr) {
    const record = allMutabaahData.find(d => d.date === dateStr);
    if (!record) return null;
    if (record.tilawah_status) return record.tilawah_status;
    if (record.amalan_data && record.amalan_data["Tilawah Al-Qur'an 1 Juz"] === true) return 'kholas';
    if (record.amalan_data && record.amalan_data["Baca Terjemah Al-Qur'an"] === true) return 'progress';
    return null; 
}

async function renderTilawah() {
    if (!currentUser || !targetUserId) return;
    await fetchAllMutabaahForTilawah();

    const now = new Date();
    const totalDaysInMonth = new Date(tilawahDate.getFullYear(), tilawahDate.getMonth() + 1, 0).getDate();
    const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    document.getElementById('calendarMonthYear').textContent = `${months[tilawahDate.getMonth()]} ${tilawahDate.getFullYear()}`;

    let kholasCount = 0;
    let filledCount = 0;
    for (let day = 1; day <= totalDaysInMonth; day++) {
        const d = new Date(tilawahDate.getFullYear(), tilawahDate.getMonth(), day);
        const dateStr = formatDateKey(d);
        const status = getTilawahStatus(dateStr);
        if (status === 'kholas') kholasCount++;
        if (status !== null) filledCount++;
    }

    const percentKholas = Math.round((kholasCount / totalDaysInMonth) * 100);
    document.getElementById('kpiPersenKholas').textContent = percentKholas + '%';
    document.getElementById('kpiBarKholas').style.width = percentKholas + '%';
    document.getElementById('kpiHariTerisi').textContent = filledCount;
    document.getElementById('kpiTotalHari').textContent = totalDaysInMonth;

    let streak = 0;
    let checkDate = new Date(now);
    for(let i=0; i<30; i++) {
        const dateStr = formatDateKey(checkDate);
        const status = getTilawahStatus(dateStr);
        if (status === 'kholas') {
            streak++;
        } else if (i > 0) {
            break;
        }
        checkDate.setDate(checkDate.getDate() - 1);
    }
    document.getElementById('streakCount').textContent = streak;
    
    let badge = '';
    if (streak >= 30) badge = '<span class="badge-achievement badge-gold">🏆 30+ Hari</span>';
    else if (streak >= 14) badge = '<span class="badge-achievement badge-silver">🥈 14+ Hari</span>';
    else if (streak >= 7) badge = '<span class="badge-achievement badge-bronze">🥉 7+ Hari</span>';
    document.getElementById('badgeContainer').innerHTML = badge;

    renderCalendarTilawah();
}

function renderCalendarTilawah() {
    const grid = document.getElementById('calendarGrid');
    const total = new Date(tilawahDate.getFullYear(), tilawahDate.getMonth() + 1, 0).getDate();
    const firstDayIndex = new Date(tilawahDate.getFullYear(), tilawahDate.getMonth(), 1).getDay();
    const prevMonth = tilawahDate.getMonth() === 0 ? 11 : tilawahDate.getMonth() - 1;
    const prevYear = tilawahDate.getMonth() === 0 ? tilawahDate.getFullYear() - 1 : tilawahDate.getFullYear();
    const prevMonthTotal = new Date(prevYear, prevMonth + 1, 0).getDate();
    const totalCells = 42;
    let html = '';
    
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        const d = prevMonthTotal - i;
        html += `<div class="calendar-cell other-month"><span class="day-num">${d}</span></div>`;
    }
    
    const today = new Date();
    const isCurrentMonth = today.getMonth() === tilawahDate.getMonth() && today.getFullYear() === tilawahDate.getFullYear();
    
    for (let day = 1; day <= total; day++) {
        const d = new Date(tilawahDate.getFullYear(), tilawahDate.getMonth(), day);
        const dateStr = formatDateKey(d);
        const statusId = getTilawahStatus(dateStr);
        const statusObj = statusId ? STATUS.find(s => s.id === statusId) : null;
        const todayClass = (isCurrentMonth && today.getDate() === day) ? 'today' : '';
        
        let iconHtml = '';
        if (statusObj) {
            iconHtml = `<span class="status-icon" style="color:${statusObj.color}">${statusObj.icon}</span>`;
        }

        html += `
            <div class="calendar-cell ${todayClass}" onclick="openTilawahSheet(${day})">
                <span class="day-num">${day}</span>
                ${iconHtml}
            </div>
        `;
    }
    
    const remainingCells = totalCells - (firstDayIndex + total);
    for (let i = 1; i <= remainingCells; i++) {
        html += `<div class="calendar-cell other-month"><span class="day-num">${i}</span></div>`;
    }
    grid.innerHTML = html;
}

function navigateTilawahPeriod(step) {
    tilawahDate.setMonth(tilawahDate.getMonth() + step);
    renderTilawah();
}

function goToTodayTilawah() {
    tilawahDate = new Date();
    renderTilawah();
}

// ==========================================
// 6. LOGIKA SHEET
// ==========================================
function buildSheetOptions() {
    const wrap = document.getElementById('sheetOptions');
    let html = STATUS.map(s => `
        <button onclick="pickTilawahStatus('${s.id}')" class="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 active:scale-[0.98] transition text-left shadow-sm">
            <span class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style="background:${s.bg}; color:${s.color}">
                ${s.icon}
            </span>
            <span class="font-bold text-sm text-slate-800 dark:text-slate-200">${s.label}</span>
        </button>
    `).join('');

    html += `
        <button onclick="deleteTilawahStatus()" class="w-full flex items-center gap-4 p-4 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 active:scale-[0.98] transition text-left mt-2 shadow-sm">
            <span class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400">
                ${ICONS.trash}
            </span>
            <span class="font-bold text-sm text-rose-700 dark:text-rose-400">Hapus Status</span>
        </button>
    `;

    wrap.innerHTML = html;
}

function openTilawahSheet(day) {
    activeEditDate = new Date(tilawahDate.getFullYear(), tilawahDate.getMonth(), day);
    const daysIndo = ["Ahad","Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];
    const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    
    const targetName = targetUserId === currentUser.id ? currentProfile.full_name : targetUserName;
    document.getElementById('sheetTitle').textContent = `${daysIndo[activeEditDate.getDay()]}, ${day} ${months[activeEditDate.getMonth()]} — ${targetName}`;
    document.getElementById('sheetOverlay').classList.remove('hidden');
    document.getElementById('tilawahSheet').classList.remove('translate-y-full');
    document.body.style.overflow = 'hidden';
}

function closeTilawahSheet() {
    document.getElementById('sheetOverlay').classList.add('hidden');
    document.getElementById('tilawahSheet').classList.add('translate-y-full');
    document.body.style.overflow = '';
    activeEditDate = null;
}

async function pickTilawahStatus(statusId) {
    if (!activeEditDate) return;
    const dateStr = formatDateKey(activeEditDate);
    
    const { error: saveError } = await supabaseClient.from('mutabaah').upsert({ 
        user_id: targetUserId, 
        date: dateStr, 
        tilawah_status: statusId 
    }, { onConflict: 'user_id, date' });

    if (saveError) {
        showToast('Gagal menyimpan status', 'error');
        return;
    }

    closeTilawahSheet();
    renderTilawah();
    if (!document.getElementById('view-mutabaah').classList.contains('hidden')) {
        renderMutabaah();
    }
    showToast('Status tilawah tersimpan', 'success');
}

async function deleteTilawahStatus() {
    if (!activeEditDate) return;
    const dateStr = formatDateKey(activeEditDate);
    
    await supabaseClient.from('mutabaah').upsert({ 
        user_id: targetUserId, 
        date: dateStr, 
        tilawah_status: null
    }, { onConflict: 'user_id, date' });

    closeTilawahSheet();
    renderTilawah();
    showToast('Status dihapus', 'info');
}

// ==========================================
// 7. LOGIKA MUTABAAH
// ==========================================
async function fetchMutabaahData() {
    const dateKey = formatDateKey(currentDate);
    const { data, error } = await supabaseClient
        .from('mutabaah').select('amalan_data')
        .eq('user_id', targetUserId).eq('date', dateKey).maybeSingle(); 

    currentData = (data && data.amalan_data) ? data.amalan_data : {};
}

async function saveMutabaahData() {
    const dateKey = formatDateKey(currentDate);
    try {
        const { error } = await supabaseClient
            .from('mutabaah')
            .upsert({ 
                user_id: targetUserId, 
                date: dateKey, 
                amalan_data: currentData 
            }, { onConflict: 'user_id, date' });

        if (error) {
            console.error("Supabase Error:", error);
            showToast('Gagal menyimpan: ' + error.message, 'error');
        }
    } catch (err) {
        console.error("Catch Error:", err);
        showToast('Terjadi kesalahan sistem saat menyimpan', 'error');
    }
}

async function renderMutabaah() {
    if (!currentUser || !targetUserId) return;
    await fetchMutabaahData();
    
    const dateKey = formatDateKey(currentDate);
    document.getElementById('datePicker').value = dateKey;
    const isToday = dateKey === formatDateKey(new Date());
    document.getElementById('amalanDateLabel').textContent = isToday ? "Hari Ini" : "Edit Riwayat";
    
    const list = document.getElementById('mutabaahList');
    let doneCount = 0;

    list.innerHTML = DEFAULT_AMALAN.map((text) => {
        const isDone = currentData[text] === true;
        if (isDone) doneCount++;
        return `
        <div class="mutabaah-item ${isDone ? 'checked' : ''} flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 cursor-pointer transition hover:border-brand-500" onclick="toggleAmalan(\`${text}\`)">
            <span class="text-[13px] font-semibold text-slate-700 dark:text-slate-300 pr-2 ${isDone ? 'line-through opacity-50' : ''}">${text}</span>
            <div class="mutabaah-checkbox w-6 h-6 rounded-md border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0 transition-colors">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>
            </div>
        </div>`;
    }).join('');

    const total = DEFAULT_AMALAN.length;
    const percent = Math.round((doneCount / total) * 100);
    document.getElementById('mainProgressText').textContent = percent + '%';
    document.getElementById('statDone').textContent = doneCount;
    document.getElementById('statPending').textContent = total - doneCount;
    const ring = document.getElementById('mainProgressRing');
    ring.style.strokeDashoffset = 213.6 - (percent / 100) * 213.6;
}

async function toggleAmalan(amalanName) {
    if (navigator.vibrate) navigator.vibrate(50);
    if (currentData[amalanName]) delete currentData[amalanName];
    else currentData[amalanName] = true;
    await saveMutabaahData();
    renderMutabaah();
    if (!document.getElementById('view-tilawah').classList.contains('hidden')) {
        renderTilawah();
    }
}

function changeDate(offset) {
    currentDate.setDate(currentDate.getDate() + offset);
    renderMutabaah();
}

function onDateChange() {
    const val = document.getElementById('datePicker').value;
    if (val) { currentDate = new Date(val); renderMutabaah(); }
}

// ==========================================
// 8. LOGIKA REKAP & GRAFIK (MURNI DARI MUTABAAH)
// ==========================================
async function renderRekap() {
    if (!currentUser || !targetUserId) return;

    const startStr = document.getElementById('rekapStart').value;
    const endStr = document.getElementById('rekapEnd').value;

    if (!startStr || !endStr) return;

    const { data, error } = await supabaseClient
        .from('mutabaah').select('date, amalan_data')
        .eq('user_id', targetUserId)
        .gte('date', startStr)
        .lte('date', endStr);

    if (error) return;

    let amalanCounts = {};
    DEFAULT_AMALAN.forEach(a => amalanCounts[a] = 0);
    
    let totalDays = 0;
    let loopDate = new Date(startStr);
    let endDate = new Date(endStr);
    while (loopDate <= endDate) { totalDays++; loopDate.setDate(loopDate.getDate() + 1); }

    data.forEach(record => {
        DEFAULT_AMALAN.forEach(amalan => {
            if (record.amalan_data && record.amalan_data[amalan] === true) {
                amalanCounts[amalan]++;
            }
        });
    });

    const tbody = document.getElementById('tbody-rekap');
    tbody.innerHTML = DEFAULT_AMALAN.map(amalan => {
        const count = amalanCounts[amalan];
        const percent = totalDays > 0 ? Math.round((count / totalDays) * 100) : 0;
        let barColor = percent > 70 ? 'bg-brand-500' : percent > 40 ? 'bg-amber-400' : 'bg-slate-200 dark:bg-slate-700';

        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                <td class="px-4 py-3 text-left font-bold text-slate-700 dark:text-slate-300 sticky left-0 bg-white dark:bg-slate-900">${amalan}</td>
                <td class="px-4 py-3 font-extrabold text-brand-600 dark:text-brand-400">${count} <span class="text-xs font-normal text-slate-400">/ ${totalDays} hr</span></td>
                <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                        <div class="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div class="${barColor} h-full rounded-full" style="width: ${percent}%"></div>
                        </div>
                        <span class="text-xs font-bold w-8 text-right">${percent}%</span>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    renderCharts(data, totalDays, amalanCounts);
}

function renderCharts(data, totalDays, amalanCounts) {
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#94a3b8' : '#64748b';

    if (chartBarInstance) chartBarInstance.destroy();
    if (chartDonutInstance) chartDonutInstance.destroy();

    const labels = DEFAULT_AMALAN.map(a => a.length > 20 ? a.substring(0, 18) + '...' : a);
    const values = DEFAULT_AMALAN.map(a => amalanCounts[a]);

    chartBarInstance = new Chart(document.getElementById('chartBar'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Selesai',
                data: values,
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderColor: '#059669',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, suggestedMax: totalDays, ticks: { precision: 0, color: textColor } },
                x: { ticks: { color: textColor, font: { size: 9 }, maxRotation: 45, minRotation: 45 }, grid: { display: false } }
            }
        }
    });

    const totalChecked = Object.values(amalanCounts).reduce((a, b) => a + b, 0);
    const totalPossible = DEFAULT_AMALAN.length * totalDays;

    chartDonutInstance = new Chart(document.getElementById('chartDonut'), {
        type: 'doughnut',
        data: {
            labels: ['Selesai', 'Belum'],
            datasets: [{
                data: [totalChecked, Math.max(0, totalPossible - totalChecked)],
                backgroundColor: ['#10b981', isDark ? '#334155' : '#e2e8f0'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '75%',
            plugins: {
                legend: { position: 'bottom', labels: { color: textColor } },
                tooltip: { callbacks: { label: c => ` ${c.label}: ${c.parsed}` } }
            }
        }
    });
}

// ==========================================
// 9. GANTI PASSWORD
// ==========================================
function openChangePasswordModal() {
    document.getElementById('changePasswordModal').classList.remove('hidden');
    document.getElementById('changePasswordModal').classList.add('flex');
    document.getElementById('newPasswordInput').value = '';
}

function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').classList.add('hidden');
    document.getElementById('changePasswordModal').classList.remove('flex');
}

async function handleChangePassword() {
    const newPassword = document.getElementById('newPasswordInput').value;
    if (newPassword.length < 6) {
        showToast('Password minimal 6 karakter', 'warning');
        return;
    }

    const { error } = await supabaseClient.auth.updateUser({ password: newPassword });

    if (error) {
        showToast('Gagal mengganti password: ' + error.message, 'error');
    } else {
        showToast('Password berhasil diperbarui!', 'success');
        closeChangePasswordModal();
    }
}

// ==========================================
// 10. NAVIGATION & UTILITIES
// ==========================================
function switchTab(tab) {
    const views = ['tilawah', 'mutabaah', 'rekap'];
    const dMenus = ['menu-desktop-tilawah', 'menu-desktop-mutabaah', 'menu-desktop-rekap'];
    const mMenus = ['menu-mobile-tilawah', 'menu-mobile-mutabaah', 'menu-mobile-rekap'];

    views.forEach(v => document.getElementById('view-' + v).classList.add('hidden'));
    document.getElementById('view-' + tab).classList.remove('hidden');

    dMenus.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el) {
            if (views[i] === tab) el.classList.add('active');
            else el.classList.remove('active');
        }
    });

    if (mMenus) {
        mMenus.forEach((id, i) => {
            const el = document.getElementById(id);
            if (!el) return;
            if (views[i] === tab) {
                el.className = "flex flex-col items-center justify-center w-full h-full text-brand-600 dark:text-brand-400 transition-colors duration-200";
            } else {
                el.className = "flex flex-col items-center justify-center w-full h-full text-slate-400 dark:text-slate-500 transition-colors duration-200";
            }
        });
    }

    if (tab === 'mutabaah') renderMutabaah();
    if (tab === 'tilawah') renderTilawah();
    if (tab === 'rekap') {
        if (!document.getElementById('rekapStart').value) {
            const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            document.getElementById('rekapStart').value = formatDateKey(firstDay);
            document.getElementById('rekapEnd').value = formatDateKey(new Date());
        }
        renderRekap();
    }
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast pointer-events-auto min-w-[250px] p-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-bold border-l-4 ${
        type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-500' : 
        type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-500' :
        'bg-blue-50 text-blue-800 border-blue-500'
    }`;
    toast.innerHTML = `${msg}`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}

function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    if (!document.getElementById('view-rekap').classList.contains('hidden')) {
        renderRekap();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark');
    }
    checkAuth();
});