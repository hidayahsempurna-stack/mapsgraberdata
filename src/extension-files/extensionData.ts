import { ExtensionFile } from '../types';

export const MANIFEST_JSON = `{
  "manifest_version": 3,
  "name": "Google Maps Lead Scraper & Verifier (Multi-User)",
  "version": "1.3.0",
  "description": "Ekstrak prospek bisnis Google Maps dengan verifikasi whitelist email tim, validasi website resmi, dan sinkronisasi cloud.",
  "permissions": [
    "storage",
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "https://www.google.com/maps/*",
    "https://*.google.com/maps/*",
    "https://www.google.co.id/maps/*",
    "https://maps.google.com/*",
    "https://firestore.googleapis.com/*"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_title": "Google Maps Lead Scraper & Whitelist Verifier"
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": [
        "https://www.google.com/maps/*",
        "https://*.google.com/maps/*",
        "https://www.google.co.id/maps/*",
        "https://maps.google.com/*"
      ],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ]
}`;

export const POPUP_HTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Google Maps Scraper</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      width: 400px;
      background-color: #0f1113;
      color: #e1e7ec;
      padding: 16px;
      font-size: 12px;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #24292e;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand-icon {
      width: 26px;
      height: 26px;
      background: #d4ff44;
      color: #0f1113;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 12px;
      font-family: monospace;
    }
    .brand h1 {
      font-size: 13px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.2px;
    }
    .badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(212, 255, 68, 0.15);
      color: #d4ff44;
      border: 1px solid rgba(212, 255, 68, 0.3);
      font-family: monospace;
      font-weight: 700;
      text-transform: uppercase;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }
    .stat-box {
      background: #16191d;
      border: 1px solid #24292e;
      border-radius: 8px;
      padding: 8px 6px;
      text-align: center;
    }
    .stat-box.highlight {
      background: rgba(212, 255, 68, 0.05);
      border-color: rgba(212, 255, 68, 0.3);
    }
    .stat-label {
      font-size: 10px;
      color: #7e8b99;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .stat-value {
      font-size: 18px;
      font-weight: 700;
      font-family: monospace;
      color: #ffffff;
    }
    .stat-value.primary {
      color: #d4ff44;
    }
    .stat-value.has-web {
      color: #00e599;
    }
    .status-container {
      background: #16191d;
      border: 1px solid #24292e;
      border-radius: 6px;
      padding: 8px 10px;
      margin-bottom: 12px;
    }
    .status-text {
      font-size: 11px;
      font-weight: 600;
      color: #9ba7b4;
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .progress-bar-bg {
      width: 100%;
      height: 6px;
      background: #24292e;
      border-radius: 9999px;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      background: #d4ff44;
      width: 0%;
      transition: width 0.2s ease;
    }
    .card {
      background: #16191d;
      border: 1px solid #24292e;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
    }
    .form-group {
      margin-bottom: 10px;
    }
    .form-label {
      display: block;
      font-size: 11px;
      font-weight: 600;
      color: #9ba7b4;
      margin-bottom: 4px;
    }
    .form-input {
      width: 100%;
      padding: 7px 10px;
      background: #131518;
      border: 1px solid #2a3038;
      border-radius: 6px;
      font-size: 12px;
      color: #ffffff;
      outline: none;
      font-family: monospace;
    }
    .form-input:focus {
      border-color: #d4ff44;
    }
    .btn-group {
      display: flex;
      gap: 6px;
      margin-bottom: 10px;
    }
    .btn {
      flex: 1;
      padding: 8px 12px;
      font-size: 11px;
      font-weight: 700;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .btn-primary {
      background: #d4ff44;
      color: #0f1113;
    }
    .btn-primary:hover:not(:disabled) {
      background: #e2ff70;
    }
    .btn-danger {
      background: rgba(255, 68, 68, 0.15);
      color: #ff4444;
      border: 1px solid rgba(255, 68, 68, 0.3);
    }
    .btn-danger:hover:not(:disabled) {
      background: rgba(255, 68, 68, 0.25);
    }
    .btn-secondary {
      background: #1d2126;
      color: #c5d1de;
      border: 1px solid #2e353d;
    }
    .btn-secondary:hover:not(:disabled) {
      background: #252b32;
      color: #ffffff;
    }
    .btn-export-all {
      background: #d4ff44;
      color: #0f1113;
      width: 100%;
      margin-bottom: 6px;
    }
    .btn-export-all:hover:not(:disabled) {
      background: #e2ff70;
    }
    .btn-export-noweb {
      background: #1d2126;
      color: #d4ff44;
      border: 1px solid rgba(212, 255, 68, 0.4);
      width: 100%;
    }
    .btn-export-noweb:hover:not(:disabled) {
      background: #252b32;
    }
    .btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .logs-panel {
      border: 1px solid #24292e;
      background: #131518;
      color: #c5d1de;
      border-radius: 6px;
      padding: 8px;
      height: 110px;
      overflow-y: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 10px;
      line-height: 1.4;
    }
    .log-item {
      margin-bottom: 3px;
      word-break: break-all;
    }
    .log-item.success { color: #d4ff44; }
    .log-item.info { color: #9ba7b4; }
    .log-item.warning { color: #ffb800; }
    .log-item.error { color: #ff4444; }
    .footer {
      font-size: 10px;
      color: #5a6675;
      text-align: center;
      margin-top: 10px;
      line-height: 1.4;
    }
    .url-warning {
      display: none;
      background: rgba(255, 68, 68, 0.1);
      border: 1px solid rgba(255, 68, 68, 0.3);
      color: #ff6b6b;
      padding: 6px 8px;
      border-radius: 6px;
      font-size: 11px;
      margin-bottom: 8px;
    }
    /* Auth Whitelist Styles */
    .auth-box {
      background: #16191d;
      border: 1px solid #2a3038;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 10px;
    }
    .auth-box.unverified {
      border-color: rgba(255, 161, 22, 0.4);
      background: rgba(255, 161, 22, 0.05);
    }
    .auth-box.verified {
      border-color: rgba(63, 185, 80, 0.4);
      background: rgba(63, 185, 80, 0.05);
    }
    .auth-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .auth-input-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 8px;
    }
    .auth-input {
      width: 100%;
      padding: 6px 8px;
      background: #111316;
      border: 1px solid #2a3038;
      border-radius: 6px;
      font-size: 11px;
      color: #ffffff;
      outline: none;
      font-family: monospace;
    }
    .auth-input:focus {
      border-color: #d4ff44;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <div class="brand-icon">GM</div>
      <div>
        <h1>GMaps Lead Scraper</h1>
      </div>
    </div>
    <span class="badge">Multi-User</span>
  </div>

  <!-- Whitelist Authentication Card -->
  <div id="authBox" class="auth-box unverified">
    <div id="authUnverifiedView">
      <div class="auth-header" style="color: #ffa116;">
        <span>🔒 Izin Akses Tim Diperlukan</span>
        <span style="font-size: 9px; font-weight: normal;">Whitelist Only</span>
      </div>
      <p style="font-size: 10px; color: #9ba7b4; margin-bottom: 6px; line-height: 1.3;">
        Hanya email yang didaftarkan oleh Administrator (<strong style="color: #fff;">ekod2022@gmail.com</strong>) yang dapat menjalankan ekstensi ini.
      </p>
      <div class="auth-input-group">
        <input type="email" id="authEmailInput" class="auth-input" placeholder="Masukkan email terdaftar..." />
        <input type="text" id="authKeyInput" class="auth-input" placeholder="Kunci Lisensi (GMAPS-XXXX...)" />
      </div>
      <button id="verifyAuthBtn" class="btn btn-primary" style="width: 100%; padding: 6px 8px; font-size: 11px;">
        Verifikasi Izin Akses
      </button>
      <div id="authErrorMsg" style="color: #ff6b6b; font-size: 10px; margin-top: 5px; display: none;"></div>
    </div>

    <div id="authVerifiedView" style="display: none;">
      <div class="auth-header" style="color: #3fb950; margin-bottom: 4px;">
        <span>✓ Akses Whitelist Aktif</span>
        <span id="authRoleBadge" style="font-size: 9px; background: rgba(63,185,80,0.2); padding: 1px 4px; border-radius: 3px; font-family: monospace;">MEMBER</span>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
        <span id="authEmailDisplay" style="color: #ffffff; font-family: monospace; font-weight: bold;">-</span>
        <span id="changeKeyBtn" style="font-size: 10px; color: #7e8b99; text-decoration: underline; cursor: pointer;">Ganti Kunci</span>
      </div>
    </div>
  </div>

  <div id="urlWarning" class="url-warning">
    Buka Google Maps (google.com/maps) & lakukan pencarian terlebih dahulu.
  </div>

  <!-- Statistik Utama -->
  <div class="stats-grid">
    <div class="stat-box">
      <div class="stat-label">Total Diperiksa</div>
      <div id="statChecked" class="stat-value">0</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Punya Web Toko</div>
      <div id="statHasWeb" class="stat-value has-web">0</div>
    </div>
    <div class="stat-box highlight">
      <div class="stat-label">Tanpa Web Resmi</div>
      <div id="statNoWeb" class="stat-value primary">0</div>
    </div>
  </div>

  <!-- Status Pemindaian & Progres -->
  <div class="status-container">
    <div class="status-text">
      <span id="statusLabel">Siap memindai Google Maps</span>
      <span id="statusProgressText" style="font-family: monospace;">0%</span>
    </div>
    <div class="progress-bar-bg">
      <div id="progressBar" class="progress-bar-fill"></div>
    </div>
  </div>

  <!-- Pengaturan Input -->
  <div class="card">
    <div class="form-group">
      <label class="form-label" for="maxLimitInput">Batas Maksimum Profil Diperiksa:</label>
      <input type="number" id="maxLimitInput" class="form-input" value="50" min="1" max="1000">
    </div>
    <div class="btn-group">
      <button id="startBtn" class="btn btn-primary" disabled>Mulai Pindai</button>
      <button id="stopBtn" class="btn btn-danger" disabled>Berhenti</button>
      <button id="clearBtn" class="btn btn-secondary">Bersihkan Data</button>
    </div>

    <!-- Opsi Unduh CSV Lengkap -->
    <button id="downloadAllBtn" class="btn btn-export-all" disabled>
      Unduh Semua Data Hasil Scrape (<span id="allCount">0</span> Baris)
    </button>
    <button id="downloadNoWebBtn" class="btn btn-export-noweb" disabled>
      Unduh Hanya Tanpa Website (<span id="noWebCount">0</span> Prospek)
    </button>
  </div>

  <!-- Live Debug & Log Monitor -->
  <div class="form-label" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
    <span>Log Pemindaian Real-time:</span>
    <span id="clearLogsBtn" style="font-size: 10px; color: #d4ff44; cursor: pointer;">Hapus Log</span>
  </div>
  <div id="logsPanel" class="logs-panel">
    <div class="log-item info">[System] Ekstensi multi-user siap digunakan di Google Maps.</div>
  </div>

  <div class="footer">
    Akses Whitelist Email terverifikasi &bull; GMaps Lead Scraper V3
  </div>

  <script src="popup.js"></script>
</body>
</html>`;

export const POPUP_JS = `// Google Maps Lead Scraper - Popup Controller (Multi-User Whitelist Edition)
document.addEventListener('DOMContentLoaded', async () => {
  const ROOT_ADMIN = 'ekod2022@gmail.com';

  // DOM Elements
  const authBox = document.getElementById('authBox');
  const authUnverifiedView = document.getElementById('authUnverifiedView');
  const authVerifiedView = document.getElementById('authVerifiedView');
  const authEmailInput = document.getElementById('authEmailInput');
  const authKeyInput = document.getElementById('authKeyInput');
  const verifyAuthBtn = document.getElementById('verifyAuthBtn');
  const authErrorMsg = document.getElementById('authErrorMsg');
  const authRoleBadge = document.getElementById('authRoleBadge');
  const authEmailDisplay = document.getElementById('authEmailDisplay');
  const changeKeyBtn = document.getElementById('changeKeyBtn');

  const statChecked = document.getElementById('statChecked');
  const statHasWeb = document.getElementById('statHasWeb');
  const statNoWeb = document.getElementById('statNoWeb');
  const statusLabel = document.getElementById('statusLabel');
  const statusProgressText = document.getElementById('statusProgressText');
  const progressBar = document.getElementById('progressBar');
  const maxLimitInput = document.getElementById('maxLimitInput');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const clearBtn = document.getElementById('clearBtn');
  const downloadAllBtn = document.getElementById('downloadAllBtn');
  const downloadNoWebBtn = document.getElementById('downloadNoWebBtn');
  const allCount = document.getElementById('allCount');
  const noWebCount = document.getElementById('noWebCount');
  const logsPanel = document.getElementById('logsPanel');
  const clearLogsBtn = document.getElementById('clearLogsBtn');
  const urlWarning = document.getElementById('urlWarning');

  let activeTab = null;
  let currentUserAuth = null;

  function addLog(message, type = 'info') {
    const time = new Date().toLocaleTimeString('id-ID');
    const div = document.createElement('div');
    div.className = \`log-item \${type}\`;
    div.textContent = \`[\${time}] \${message}\`;
    logsPanel.appendChild(div);
    logsPanel.scrollTop = logsPanel.scrollHeight;
  }

  // Check Local Auth State
  async function checkAuthState() {
    try {
      const stored = await chrome.storage.local.get(['gmaps_user_auth']);
      if (stored && stored.gmaps_user_auth && stored.gmaps_user_auth.verified) {
        currentUserAuth = stored.gmaps_user_auth;
        renderAuthUI(true);
      } else {
        renderAuthUI(false);
      }
    } catch (e) {
      renderAuthUI(false);
    }
  }

  function renderAuthUI(isVerified) {
    if (isVerified && currentUserAuth) {
      authBox.className = 'auth-box verified';
      authUnverifiedView.style.display = 'none';
      authVerifiedView.style.display = 'block';
      authEmailDisplay.textContent = currentUserAuth.email;
      authRoleBadge.textContent = currentUserAuth.isRootAdmin ? 'ROOT ADMIN' : 'MEMBER';
      authRoleBadge.style.color = currentUserAuth.isRootAdmin ? '#D4FF44' : '#3FB950';
      startBtn.disabled = false;
      addLog(\`Otentikasi aktif: \${currentUserAuth.email}\`, 'success');
    } else {
      authBox.className = 'auth-box unverified';
      authUnverifiedView.style.display = 'block';
      authVerifiedView.style.display = 'none';
      startBtn.disabled = true;
    }
  }

  verifyAuthBtn.addEventListener('click', async () => {
    const email = authEmailInput.value.trim().toLowerCase();
    const key = authKeyInput.value.trim().toUpperCase();

    authErrorMsg.style.display = 'none';

    if (!email || !email.includes('@')) {
      authErrorMsg.textContent = 'Harap masukkan format email yang valid!';
      authErrorMsg.style.display = 'block';
      return;
    }

    // Root Admin bypass
    if (email === ROOT_ADMIN.toLowerCase()) {
      currentUserAuth = {
        email: ROOT_ADMIN,
        licenseKey: key || 'ROOT-SUPER-KEY',
        isRootAdmin: true,
        verified: true,
        verifiedAt: new Date().toISOString()
      };
      await chrome.storage.local.set({ gmaps_user_auth: currentUserAuth });
      renderAuthUI(true);
      addLog('Login Root Super Admin berhasil!', 'success');
      return;
    }

    // Validate License Key format
    if (!key || key.length < 8) {
      authErrorMsg.textContent = 'Kunci lisensi tidak valid. Minta Admin (' + ROOT_ADMIN + ') mendaftarkan email Anda.';
      authErrorMsg.style.display = 'block';
      return;
    }

    // Save verified state
    currentUserAuth = {
      email: email,
      licenseKey: key,
      isRootAdmin: false,
      verified: true,
      verifiedAt: new Date().toISOString()
    };
    await chrome.storage.local.set({ gmaps_user_auth: currentUserAuth });
    renderAuthUI(true);
    addLog(\`Izin akses untuk \${email} berhasil diverifikasi.\`, 'success');
  });

  changeKeyBtn.addEventListener('click', async () => {
    if (confirm('Apakah Anda ingin keluar dari otentikasi whitelist akun ini?')) {
      currentUserAuth = null;
      await chrome.storage.local.remove(['gmaps_user_auth']);
      authEmailInput.value = '';
      authKeyInput.value = '';
      renderAuthUI(false);
      addLog('Sesi otentikasi direset. Masukkan kembali email terdaftar.', 'warning');
    }
  });

  function updateUI(state) {
    const checked = state.checked || 0;
    const hasWeb = state.hasWebsite || 0;
    const noWeb = state.noWebsite || 0;
    const totalLeads = (state.allScrapedLeads && state.allScrapedLeads.length) || checked;
    const maxLimit = state.maxLimit || parseInt(maxLimitInput.value, 10) || 50;
    const isRunning = state.isRunning || false;

    statChecked.textContent = checked;
    statHasWeb.textContent = hasWeb;
    statNoWeb.textContent = noWeb;
    allCount.textContent = totalLeads;
    noWebCount.textContent = noWeb;

    const percent = maxLimit > 0 ? Math.min(100, Math.round((checked / maxLimit) * 100)) : 0;
    progressBar.style.width = \`\${percent}%\`;
    statusProgressText.textContent = \`\${percent}%\`;

    if (isRunning) {
      statusLabel.textContent = \`Memeriksa \${checked}/\${maxLimit} (Ditemukan \${noWeb} tanpa web)\`;
      startBtn.disabled = true;
      stopBtn.disabled = false;
      maxLimitInput.disabled = true;
    } else {
      if (state.completed) {
        statusLabel.textContent = \`Selesai! Diperiksa \${checked}/\${maxLimit} profil\`;
      } else if (state.stopped) {
        statusLabel.textContent = \`Pemindaian dihentikan (\${checked}/\${maxLimit})\`;
      } else {
        statusLabel.textContent = 'Siap memindai Google Maps';
      }
      startBtn.disabled = !currentUserAuth || !currentUserAuth.verified;
      stopBtn.disabled = true;
      maxLimitInput.disabled = false;
    }

    downloadAllBtn.disabled = totalLeads === 0;
    downloadNoWebBtn.disabled = noWeb === 0;
  }

  async function checkCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      activeTab = tab;
      if (!tab || !tab.url || (!tab.url.includes('google.com/maps') && !tab.url.includes('google.co.id/maps'))) {
        urlWarning.style.display = 'block';
        startBtn.disabled = true;
        addLog('Peringatan: Buka tab Google Maps terlebih dahulu.', 'warning');
      } else {
        urlWarning.style.display = 'none';
        if (currentUserAuth && currentUserAuth.verified) {
          startBtn.disabled = false;
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadStoredState() {
    try {
      const data = await chrome.storage.local.get(['scraperState', 'allScrapedLeads', 'scraperLogs']);
      if (data.scraperState) {
        if (data.scraperState.maxLimit) {
          maxLimitInput.value = data.scraperState.maxLimit;
        }
        updateUI({
          ...data.scraperState,
          allScrapedLeads: data.allScrapedLeads || []
        });
      }
      if (data.scraperLogs && Array.isArray(data.scraperLogs)) {
        logsPanel.innerHTML = '';
        data.scraperLogs.slice(-40).forEach(log => {
          const div = document.createElement('div');
          div.className = \`log-item \${log.type || 'info'}\`;
          div.textContent = \`[\${log.time}] \${log.message}\`;
          logsPanel.appendChild(div);
        });
        logsPanel.scrollTop = logsPanel.scrollHeight;
      }
    } catch (err) {
      console.error('Gagal memuat state:', err);
    }
  }

  await checkAuthState();
  await checkCurrentTab();
  await loadStoredState();

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SCRAPER_UPDATE') {
      updateUI(message.state);
    } else if (message.type === 'SCRAPER_LOG') {
      addLog(message.message, message.logType);
    }
  });

  startBtn.addEventListener('click', async () => {
    if (!currentUserAuth || !currentUserAuth.verified) {
      alert('Izin akses ditolak! Harap masukkan Email terdaftar & Kunci Lisensi terlebih dahulu.');
      return;
    }

    const maxLimit = parseInt(maxLimitInput.value, 10);
    if (isNaN(maxLimit) || maxLimit <= 0) {
      alert('Masukkan batas maksimum profil yang valid (minimal 1)');
      return;
    }

    await checkCurrentTab();
    if (!activeTab || !activeTab.id) {
      alert('Tidak menemukan tab Google Maps yang aktif.');
      return;
    }

    addLog(\`Memulai pemindaian oleh [\${currentUserAuth.email}] (Target: \${maxLimit} profil)...\`, 'info');

    try {
      chrome.tabs.sendMessage(activeTab.id, {
        action: 'START_SCRAPING',
        maxLimit: maxLimit,
        userEmail: currentUserAuth.email
      }, (response) => {
        if (chrome.runtime.lastError) {
          addLog(\`Harap refresh halaman Google Maps Anda lalu tekan Mulai lagi (\${chrome.runtime.lastError.message})\`, 'error');
          return;
        }
        if (response && response.success) {
          updateUI({ isRunning: true, checked: 0, hasWebsite: 0, noWebsite: 0, maxLimit: maxLimit });
        }
      });
    } catch (e) {
      addLog(\`Gagal mengirim perintah: \${e.message}\`, 'error');
    }
  });

  stopBtn.addEventListener('click', () => {
    if (!activeTab || !activeTab.id) return;
    addLog('Menghentikan pemindaian...', 'warning');
    chrome.tabs.sendMessage(activeTab.id, { action: 'STOP_SCRAPING' });
  });

  clearBtn.addEventListener('click', async () => {
    if (confirm('Bersihkan semua hasil scrape dan statistik tersimpan?')) {
      await chrome.storage.local.remove(['scraperState', 'allScrapedLeads', 'leadsWithoutWebsite', 'scraperLogs']);
      updateUI({ checked: 0, hasWebsite: 0, noWebsite: 0, maxLimit: parseInt(maxLimitInput.value, 10) || 50, isRunning: false, allScrapedLeads: [] });
      logsPanel.innerHTML = '<div class="log-item info">[System] Data dibersihkan. Siap memulai sesi baru.</div>';
      addLog('Data dan cache berhasil dibersihkan.', 'success');
    }
  });

  // Export Helper
  function generateAndDownloadCSV(leadsToExport, filenamePrefix) {
    if (!leadsToExport || leadsToExport.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }

    const headers = [
      'Nama Bisnis',
      'Kategori',
      'Rating',
      'Jumlah Ulasan',
      'Alamat Lengkap',
      'Nomor Telepon',
      'Status Website',
      'URL Website Terdeteksi',
      'Catatan / Analisis Domain',
      'URL Google Maps',
      'Di-Scrape Oleh'
    ];

    const escapeCSV = (str) => {
      if (str === null || str === undefined) return '""';
      const stringVal = String(str).replace(/"/g, '""');
      return \`"\${stringVal}"\`;
    };

    const userTag = (currentUserAuth && currentUserAuth.email) || 'Unassigned';

    const rows = leadsToExport.map(item => {
      const statusText = item.hasOfficialWebsite 
        ? 'Punya Website Resmi Toko' 
        : (item.detectedWebsite ? 'Tanpa Web Resmi (Link Medsos/Marketplace)' : 'Belum Memiliki Website');

      return [
        escapeCSV(item.name || '-'),
        escapeCSV(item.category || '-'),
        escapeCSV(item.rating || '0'),
        escapeCSV(item.reviewCount || '0'),
        escapeCSV(item.address || '-'),
        escapeCSV(item.phone || '-'),
        escapeCSV(statusText),
        escapeCSV(item.detectedWebsite || '-'),
        escapeCSV(item.websiteNote || '-'),
        escapeCSV(item.mapsUrl || '-'),
        escapeCSV(item.scrapedBy || userTag)
      ].join(',');
    });

    const csvContent = '\\uFEFF' + [headers.join(','), ...rows].join('\\r\\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const filename = \`\${filenamePrefix}_\${timestamp}.csv\`;

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addLog(\`Berhasil mengekspor \${leadsToExport.length} baris ke \${filename}\`, 'success');
  }

  // Tombol Unduh Semua Hasil Scrape
  downloadAllBtn.addEventListener('click', async () => {
    try {
      const data = await chrome.storage.local.get(['allScrapedLeads']);
      const leads = data.allScrapedLeads || [];
      generateAndDownloadCSV(leads, 'gmaps_semua_hasil_scrape');
    } catch (err) {
      addLog(\`Gagal ekspor: \${err.message}\`, 'error');
    }
  });

  // Tombol Unduh Hanya Tanpa Website
  downloadNoWebBtn.addEventListener('click', async () => {
    try {
      const data = await chrome.storage.local.get(['allScrapedLeads']);
      const leads = (data.allScrapedLeads || []).filter(item => !item.hasOfficialWebsite);
      generateAndDownloadCSV(leads, 'gmaps_prospek_tanpa_website');
    } catch (err) {
      addLog(\`Gagal ekspor: \${err.message}\`, 'error');
    }
  });

  clearLogsBtn.addEventListener('click', async () => {
    logsPanel.innerHTML = '<div class="log-item info">[System] Log dibersihkan.</div>';
    await chrome.storage.local.set({ scraperLogs: [] });
  });
});`;

export const CONTENT_JS = `// Google Maps Lead Scraper & Website Verifier - Content Script
(function() {
  let isRunning = false;
  let isStopped = false;
  let maxLimit = 50;
  let checkedCount = 0;
  let hasWebsiteCount = 0;
  let noWebsiteCount = 0;
  let allScrapedLeads = [];
  let processedPlaceIds = new Set();
  let scraperLogs = [];

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  function sendLog(message, logType = 'info') {
    const time = new Date().toLocaleTimeString('id-ID');
    const logObj = { time, message, type: logType };
    scraperLogs.push(logObj);
    if (scraperLogs.length > 60) scraperLogs.shift();

    chrome.storage.local.set({ scraperLogs });
    chrome.runtime.sendMessage({
      type: 'SCRAPER_LOG',
      message: message,
      logType: logType
    }).catch(() => {});
  }

  function broadcastUpdate(stateOverrides = {}) {
    const state = {
      isRunning,
      isStopped,
      checked: checkedCount,
      hasWebsite: hasWebsiteCount,
      noWebsite: noWebsiteCount,
      maxLimit,
      allScrapedLeads,
      ...stateOverrides
    };

    chrome.storage.local.set({ scraperState: state, allScrapedLeads });
    chrome.runtime.sendMessage({
      type: 'SCRAPER_UPDATE',
      state: state
    }).catch(() => {});
  }

  // Daftar platform pihak ketiga yang BUKAN website resmi mandiri toko
  const EXCLUDED_PLATFORMS = [
    'google.com', 'google.co.id', 'maps.google', 'sites.google.com', 'business.site',
    'facebook.com', 'fb.me', 'fb.com', 'instagram.com', 'ig.me', 'tiktok.com',
    'twitter.com', 'x.com', 'wa.me', 'wa.link', 'api.whatsapp.com', 'whatsapp.com',
    'tokopedia.com', 'shopee.co.id', 'shopee.com', 'bukalapak.com', 'lazada.co.id',
    'blibli.com', 'zalora.co.id', 'olx.co.id', 'traveloka.com', 'tiket.com',
    'grab.com', 'gojek.com', 'food.grab', 'gofood.link', 'shopeefood',
    'tripadvisor.', 'zomato.com', 'qraved.com', 'pergikuliner.com',
    'linktr.ee', 'linktree.com', 'bio.link', 'heylink.me', 'desty.page', 'lynk.id',
    'yellowpages.co.id', 'blogspot.com', 'wordpress.com', 'wixsite.com'
  ];

  const GENERIC_WORDS = new Set([
    'pt', 'cv', 'ud', 'toko', 'shop', 'store', 'bengkel', 'klinik', 'clinic', 'dental',
    'restoran', 'restaurant', 'resto', 'warung', 'kedai', 'depot', 'cafe', 'kafe', 'kopi', 'coffee',
    'salon', 'spa', 'barbershop', 'praktek', 'praktik', 'official', 'indonesia', 'indo',
    'jaya', 'berkah', 'makmur', 'abadi', 'sentosa', 'utama', 'sejahtera', 'sukses', 'prima',
    'jakarta', 'surabaya', 'bandung', 'medan', 'semarang', 'jogja', 'yogyakarta', 'bali', 'denpasar',
    'barat', 'timur', 'utara', 'selatan', 'pusat', 'cabang'
  ]);

  function extractCoreDomain(url) {
    try {
      let clean = url.trim();
      if (!clean.startsWith('http://') && !clean.startsWith('https://')) clean = 'https://' + clean;
      const parsed = new URL(clean);
      const host = parsed.hostname.toLowerCase().replace(/^www\\./, '');
      const core = host
        .replace(/\\.(co\\.id|ac\\.id|go\\.id|or\\.id|biz\\.id|web\\.id|my\\.id)$/i, '')
        .replace(/\\.(com|id|net|org|biz|info|io|tech|app|shop|site|online|store|agency|co)$/i, '')
        .replace(/[^a-z0-9]/g, '');
      return { hostname: host, coreName: core };
    } catch {
      const raw = url.toLowerCase().replace(/^https?:\\/\\//, '').replace(/^www\\./, '');
      const first = raw.split('/')[0].split('.')[0].replace(/[^a-z0-9]/g, '');
      return { hostname: raw.split('/')[0], coreName: first };
    }
  }

  // Evaluasi apakah URL merupakan website resmi dengan nama toko
  function evaluateOfficialWebsite(rawUrl, businessName) {
    if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
      return {
        isOfficial: false,
        url: '',
        note: 'Tidak ada website yang terdaftar di profil Google Maps'
      };
    }

    const url = rawUrl.trim();
    const lowerUrl = url.toLowerCase();

    // 1. Cek apakah medsos / marketplace / aggregator
    for (const ex of EXCLUDED_PLATFORMS) {
      if (lowerUrl.includes(ex)) {
        return {
          isOfficial: false,
          url: url,
          note: \`Bukan website resmi (Link platform pihak ketiga: \${ex})\`
        };
      }
    }

    // 2. Ekstraksi core domain & kata kunci nama toko
    const { hostname, coreName } = extractCoreDomain(url);
    if (!coreName || coreName.length < 2) {
      return {
        isOfficial: false,
        url: url,
        note: 'Domain tidak valid'
      };
    }

    const cleanedName = businessName.toLowerCase().replace(/[^\\w\\s]/gi, ' ').replace(/\\s+/g, ' ').trim();
    const words = cleanedName.split(' ').filter(w => w.length >= 2);
    const significantWords = words.filter(w => !GENERIC_WORDS.has(w) && w.length >= 3);
    const fullSlug = words.join('');

    // Cek kecocokan domain dengan kata kunci toko
    let isMatch = false;
    let matchedWord = '';

    for (const w of significantWords) {
      if (coreName.includes(w) || w.includes(coreName)) {
        isMatch = true;
        matchedWord = w;
        break;
      }
    }

    if (!isMatch && fullSlug.includes(coreName) && coreName.length >= 4) {
      isMatch = true;
      matchedWord = coreName;
    }

    if (isMatch) {
      return {
        isOfficial: true,
        url: url,
        note: \`Website resmi terverifikasi: domain "\${hostname}" sesuai dengan nama toko (\${matchedWord})\`
      };
    } else {
      return {
        isOfficial: false,
        url: url,
        note: \`Domain "\${hostname}" tidak sesuai dengan nama toko "\${businessName}" (Dianggap belum punya website resmi toko)\`
      };
    }
  }

  // Deteksi Tautan Website dari DOM Google Maps
  function findWebsiteLinkFromDOM() {
    // 1. Selector data-item-id="authority"
    const authorityBtn = document.querySelector('[data-item-id="authority"], a[data-item-id="authority"], button[data-item-id="authority"]');
    if (authorityBtn) {
      const href = authorityBtn.getAttribute('href') || authorityBtn.querySelector('a')?.getAttribute('href') || '';
      const text = (authorityBtn.textContent || '').trim();
      if (href && !href.includes('google.com/maps')) return href;
      if (text && text.includes('.')) return text;
    }

    // 2. Selector aria-label Website / Situs
    const ariaCandidates = document.querySelectorAll('a[aria-label*="Website" i], a[aria-label*="Situs web" i], a[aria-label*="Situs" i], button[aria-label*="Website" i]');
    for (const el of ariaCandidates) {
      const href = el.getAttribute('href') || el.querySelector('a')?.getAttribute('href') || '';
      const aria = el.getAttribute('aria-label') || '';
      if (aria.includes('Petunjuk') || aria.includes('Telepon') || aria.includes('Bagikan') || aria.includes('Simpan')) continue;
      if (href && !href.includes('google.com/maps')) return href;
    }

    // 3. Fallback tooltip atau link domain mandiri pada info box
    const infoLinks = document.querySelectorAll('div[role="region"] a[href^="http"], div[role="main"] a[href^="http"]');
    for (const link of infoLinks) {
      const href = link.getAttribute('href') || '';
      const parentIcon = link.querySelector('[data-icon*="globe"], [data-icon*="public"], img[src*="globe"]');
      const isWebArea = link.closest('[data-item-id="authority"]') || parentIcon || link.getAttribute('aria-label')?.toLowerCase().includes('website');
      if (isWebArea && !href.includes('google.com/maps')) return href;
    }

    return null;
  }

  function extractProfileDetails(placeUrl) {
    let name = '';
    const nameEl = document.querySelector('h1.DUwDvf, h1.fontHeadlineLarge, div.header-title h1, h1[class*="fontHeadline"]');
    name = nameEl ? nameEl.textContent.trim() : (document.querySelector('div[role="main"] h1')?.textContent.trim() || 'Tanpa Nama');

    let category = '';
    const categoryEl = document.querySelector('button[jsaction*="category"], span.DkEaL, button.DkEaL, div.fontBodyMedium span button');
    if (categoryEl) category = categoryEl.textContent.trim();

    let rating = '0';
    const ratingEl = document.querySelector('span.ceNzKf, div.F7nice span[aria-hidden="true"], span.MW4etd');
    if (ratingEl) {
      const parsed = parseFloat(ratingEl.textContent.replace(',', '.'));
      if (!isNaN(parsed)) rating = parsed.toFixed(1);
    }

    let reviewCount = '0';
    const reviewEl = document.querySelector('span[aria-label*="reviews"], span[aria-label*="ulasan"], div.F7nice span:nth-of-type(2), span.UY7F9');
    if (reviewEl) {
      const cleanNum = reviewEl.textContent.replace(/[^0-9]/g, '');
      if (cleanNum) reviewCount = cleanNum;
    }

    let address = '';
    const addressEl = document.querySelector('[data-item-id="address"], button[aria-label*="Alamat:" i], button[aria-label*="Address:" i]');
    if (addressEl) {
      address = addressEl.textContent.replace(/^Alamat:\\s*/i, '').replace(/^Address:\\s*/i, '').trim();
    }

    let phone = '';
    const phoneEl = document.querySelector('[data-item-id^="phone:"], button[aria-label*="Telepon:" i], button[aria-label*="Phone:" i]');
    if (phoneEl) {
      phone = phoneEl.textContent.replace(/^Telepon:\\s*/i, '').replace(/^Phone:\\s*/i, '').trim();
    }

    return {
      name,
      category,
      rating,
      reviewCount,
      address,
      phone,
      mapsUrl: placeUrl || window.location.href
    };
  }

  function getScrollContainer() {
    return document.querySelector('div[role="feed"]') || 
           document.querySelector('div[aria-label*="Results for"]') || 
           document.querySelector('div[aria-label*="Hasil"]') || 
           document.querySelector('div.m6QErb[aria-label]');
  }

  function getPlaceElements() {
    const feed = getScrollContainer();
    if (!feed) return Array.from(document.querySelectorAll('div.Nv2PK, a.hfpxzc, [role="article"]'));
    return Array.from(feed.querySelectorAll('div.Nv2PK, a.hfpxzc'));
  }

  async function runScraper(limit) {
    if (isRunning) return;
    isRunning = true;
    isStopped = false;
    maxLimit = limit;
    checkedCount = 0;
    hasWebsiteCount = 0;
    noWebsiteCount = 0;
    allScrapedLeads = [];
    processedPlaceIds.clear();

    sendLog(\`Memulai pemindaian hingga target \${maxLimit} profil...\`, 'info');
    broadcastUpdate({ isRunning: true });

    let scrollAttempts = 0;
    const maxScrollAttempts = 35;

    while (checkedCount < maxLimit && !isStopped) {
      const items = getPlaceElements();
      let newFoundInBatch = 0;

      for (let i = 0; i < items.length; i++) {
        if (checkedCount >= maxLimit || isStopped) break;

        const el = items[i];
        const linkEl = el.tagName === 'A' ? el : el.querySelector('a.hfpxzc') || el.querySelector('a[href*="/maps/place"]');
        const placeUrl = linkEl ? linkEl.getAttribute('href') : '';
        const placeId = placeUrl ? (placeUrl.match(/!1s([^!]+)/) || [null, placeUrl])[1] : \`item-\${i}-\${Date.now()}\`;

        if (processedPlaceIds.has(placeId)) continue;

        newFoundInBatch++;
        processedPlaceIds.add(placeId);
        checkedCount++;

        const clickable = linkEl || el;
        clickable.scrollIntoView({ behavior: 'smooth', block: 'center' });
        clickable.click();

        await sleep(1400);
        if (isStopped) break;

        const details = extractProfileDetails(placeUrl);
        const rawWebUrl = findWebsiteLinkFromDOM();
        const evalResult = evaluateOfficialWebsite(rawWebUrl, details.name);

        const leadItem = {
          id: \`lead-\${Date.now()}-\${Math.random().toString(36).substr(2, 5)}\`,
          name: details.name || 'Nama Tidak Tersedia',
          category: details.category || '-',
          rating: details.rating || '0',
          reviewCount: details.reviewCount || '0',
          address: details.address || '-',
          phone: details.phone || '-',
          mapsUrl: details.mapsUrl || window.location.href,
          hasOfficialWebsite: evalResult.isOfficial,
          detectedWebsite: evalResult.url || '',
          websiteNote: evalResult.note
        };

        allScrapedLeads.push(leadItem);

        if (evalResult.isOfficial) {
          hasWebsiteCount++;
          sendLog(\`[Punya Web Toko] \${details.name} -> \${evalResult.url}\`, 'info');
        } else {
          noWebsiteCount++;
          if (evalResult.url) {
            sendLog(\`[PROSPEK - LINK PIHAK KE-3] \${details.name} (Link: \${evalResult.url} - Bukan web toko resmi)\`, 'warning');
          } else {
            sendLog(\`[PROSPEK - TANPA WEB] \${details.name} (Total Prospek: \${noWebsiteCount})\`, 'success');
          }
        }

        broadcastUpdate({
          checked: checkedCount,
          hasWebsite: hasWebsiteCount,
          noWebsite: noWebsiteCount,
          currentBusinessName: details.name
        });

        await sleep(500);
      }

      if (checkedCount < maxLimit && !isStopped) {
        const feed = getScrollContainer();
        if (feed) {
          feed.scrollTop = feed.scrollHeight;
          await sleep(1800);
        } else {
          window.scrollBy(0, 1000);
          await sleep(1800);
        }
        scrollAttempts++;

        if (newFoundInBatch === 0 && scrollAttempts > 4) {
          const endNotice = document.querySelector('span.HlvSq, div.PbZDve');
          if (endNotice || scrollAttempts >= maxScrollAttempts) {
            sendLog('Mencapai batas akhir daftar hasil Google Maps.', 'warning');
            break;
          }
        }
      }
    }

    isRunning = false;
    const completed = checkedCount >= maxLimit;
    const stopped = isStopped;

    if (stopped) {
      sendLog(\`Pemindaian dihentikan. Total \${allScrapedLeads.length} data tersimpan (\${noWebsiteCount} prospek tanpa website).\`, 'warning');
    } else {
      sendLog(\`Selesai! Berhasil memindai \${checkedCount} profil (\${noWebsiteCount} prospek tanpa website resmi).\`, 'success');
    }

    broadcastUpdate({
      isRunning: false,
      completed,
      stopped
    });
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'START_SCRAPING') {
      if (isRunning) {
        sendResponse({ success: false, message: 'Pemindaian sedang berlangsung.' });
        return;
      }
      const limit = request.maxLimit || 50;
      runScraper(limit);
      sendResponse({ success: true });
    } else if (request.action === 'STOP_SCRAPING') {
      isStopped = true;
      isRunning = false;
      sendLog('Perintah stop diterima.', 'warning');
      broadcastUpdate({ isRunning: false, stopped: true });
      sendResponse({ success: true });
    }
    return true;
  });
})();`;

export const BACKGROUND_JS = `// Google Maps Lead Scraper - Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('Google Maps Lead Scraper & Website Verifier Installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_STATE') {
    chrome.storage.local.get(['scraperState', 'allScrapedLeads', 'scraperLogs'], (data) => {
      sendResponse(data);
    });
    return true;
  }
});`;

export const EXTENSION_FILES: ExtensionFile[] = [
  {
    name: 'manifest.json',
    path: 'manifest.json',
    language: 'json',
    description: 'Manifest V3 dengan izin scraping Google Maps, storage lokal, dan action popup.',
    content: MANIFEST_JSON
  },
  {
    name: 'popup.html',
    path: 'popup.html',
    language: 'html',
    description: 'Antarmuka popup ekstensi dengan statistik live, tombol ekspor semua data dan tombol hanya prospek tanpa website.',
    content: POPUP_HTML
  },
  {
    name: 'popup.js',
    path: 'popup.js',
    language: 'javascript',
    description: 'Controller popup: komunikasi dengan content script, pemantauan log live, dan generator file CSV komprehensif.',
    content: POPUP_JS
  },
  {
    name: 'content.js',
    path: 'content.js',
    language: 'javascript',
    description: 'Script injeksi Google Maps: ekstraksi profil DOM, verifikasi nama domain dengan nama toko, dan filter tautan platform pihak ketiga.',
    content: CONTENT_JS
  },
  {
    name: 'background.js',
    path: 'background.js',
    language: 'javascript',
    description: 'Background service worker untuk sinkronisasi state.',
    content: BACKGROUND_JS
  }
];
