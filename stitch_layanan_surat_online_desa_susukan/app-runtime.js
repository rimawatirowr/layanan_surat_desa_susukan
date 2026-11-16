(function () {
  if (window.__DESA_SUSUKAN_RUNTIME__) return;
  window.__DESA_SUSUKAN_RUNTIME__ = true;

  const SCREEN_ID = window.__CURRENT_SCREEN_ID__ ||
    (location.pathname.match(/\/screen\/([^\/]+)/) || [, ''])[1] ||
    (location.pathname.match(/\/(layar_[^\/]+)/) || [, 'layar_1_masuk_autentikasi_warga'])[1];

  let APP_STATE = {
    desaConfig: {},
    users: [],
    warga: [],
    jenisSurat: [],
    pengajuan: [],
    bukuRegister: [],
    waLogs: [],
    auditLogs: [],
    notifications: [],
    screens: []
  };

  // =========================================================================
  // 1. GLOBAL STYLES (Dark Mode, Print Styles, Navigator Widget, Modals)
  // =========================================================================
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    html.dark body,
    html.dark .bg-bg-ivory {
      background-color: #0C1B1A !important;
      color: #E6F0EC !important;
    }
    html.dark .bg-surface-card,
    html.dark .bg-surface-container-lowest,
    html.dark header {
      background-color: #13292A !important;
      color: #E6F0EC !important;
      border-color: #244240 !important;
    }
    html.dark .bg-surface-container-low,
    html.dark .bg-surface-container {
      background-color: #1A3536 !important;
      color: #E6F0EC !important;
    }
    html.dark .text-on-surface {
      color: #E6F0EC !important;
    }
    html.dark .text-text-muted,
    html.dark .text-on-surface-variant {
      color: #93A9A2 !important;
    }
    html.dark input,
    html.dark select,
    html.dark textarea {
      background-color: #1A3536 !important;
      color: #E6F0EC !important;
      border-color: #244240 !important;
    }
    @media (max-width: 900px) {
      aside.fixed.left-0.top-0 {
        transform: translateX(-100%);
        transition: transform 0.25s ease;
      }
      aside.fixed.left-0.top-0.mobile-drawer-open {
        transform: translateX(0);
      }
      div.pl-\\[244px\\] {
        padding-left: 0 !important;
      }
      header.fixed.left-\\[244px\\] {
        left: 0 !important;
      }
    }
    @media print {
      aside, header, #susukan-floating-dock, #susukan-universal-modal-backdrop, .no-print {
        display: none !important;
      }
      div.pl-\\[244px\\] {
        padding-left: 0 !important;
      }
      main {
        padding-top: 0 !important;
      }
    }
  `;
  document.head.appendChild(styleEl);

  if (localStorage.getItem('susukan_dark_mode') === '1') {
    document.documentElement.classList.add('dark');
  }

  // =========================================================================
  // 2. UTILITIES: TOAST, MODAL, AUDIO CHIME, CSV EXPORT, PRINT LETTER
  // =========================================================================
  function showGlobalToast(title, message, type = 'success') {
    let container = document.getElementById('susukan-global-toast');
    if (!container) {
      container = document.createElement('div');
      container.id = 'susukan-global-toast';
      container.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-300 transform translate-y-24 opacity-0 pointer-events-none';
      document.body.appendChild(container);
    }
    const borderColor = type === 'error' ? '#D64545' : type === 'warning' ? '#D97706' : '#E8B95B';
    const iconName = type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'check_circle';
    container.innerHTML = `
      <div style="background:#0F3D3E;color:#FFFFFF;border-left:4px solid ${borderColor};box-shadow:0 12px 32px rgba(0,0,0,0.28);" class="px-5 py-3.5 rounded-xl flex items-center gap-3 max-w-md min-w-[290px]">
        <span class="material-symbols-outlined text-[22px]" style="color:${borderColor}">${iconName}</span>
        <div class="flex flex-col text-left">
          <span style="font-weight:700;font-size:13px;line-height:1.3;">${title}</span>
          ${message ? `<span style="font-size:12px;color:#d2e7e2;margin-top:2px;line-height:1.35;">${message}</span>` : ''}
        </div>
      </div>
    `;
    requestAnimationFrame(() => {
      container.classList.remove('translate-y-24', 'opacity-0');
      container.classList.add('translate-y-0', 'opacity-100');
    });
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => {
      container.classList.add('translate-y-24', 'opacity-0');
      container.classList.remove('translate-y-0', 'opacity-100');
    }, 3200);
  }
  window.showGlobalToast = showGlobalToast;

  function openUniversalModal(title, bodyHtml, onConfirm, confirmLabel = 'Simpan', maxWidth = '540px') {
    let backdrop = document.getElementById('susukan-universal-modal-backdrop');
    if (backdrop) backdrop.remove();

    backdrop = document.createElement('div');
    backdrop.id = 'susukan-universal-modal-backdrop';
    backdrop.className = 'fixed inset-0 z-[9990] flex items-center justify-center p-4';
    backdrop.style.background = 'rgba(15, 61, 62, 0.55)';
    backdrop.style.backdropFilter = 'blur(4px)';

    backdrop.innerHTML = `
      <div style="max-width:${maxWidth};width:100%;max-height:90vh;background:#FFFFFF;color:#1E302D;border-radius:16px;box-shadow:0 20px 48px rgba(15,61,62,0.25);" class="flex flex-col overflow-hidden">
        <div style="background:#F7F8F5;border-bottom:1px solid #E7ECE8;" class="px-5 py-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[#176B5B]">verified_user</span>
            <h3 style="font-weight:700;font-size:16px;color:#1E302D;margin:0;">${title}</h3>
          </div>
          <button type="button" id="susukan-modal-close" class="w-8 h-8 rounded-full flex items-center justify-center text-[#74817D] hover:bg-[#E8F1ED] hover:text-[#1E302D] cursor-pointer">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div class="p-5 overflow-y-auto flex-1 text-[14px] leading-relaxed" id="susukan-modal-body">
          ${bodyHtml}
        </div>
        <div style="background:#F7F8F5;border-top:1px solid #E7ECE8;" class="px-5 py-3.5 flex items-center justify-end gap-2.5">
          <button type="button" id="susukan-modal-cancel" style="border:1px solid #E7ECE8;background:#FFFFFF;color:#1E302D;" class="px-4 py-2 rounded-[10px] font-semibold text-[13px] hover:bg-[#E8F1ED] cursor-pointer">
            Tutup
          </button>
          ${onConfirm ? `
            <button type="button" id="susukan-modal-confirm" style="background:#176B5B;color:#FFFFFF;" class="px-5 py-2 rounded-[10px] font-semibold text-[13px] hover:opacity-95 cursor-pointer flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[17px]">check_circle</span>
              <span>${confirmLabel}</span>
            </button>
          ` : ''}
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    const close = () => backdrop.remove();
    backdrop.querySelector('#susukan-modal-close').addEventListener('click', close);
    backdrop.querySelector('#susukan-modal-cancel').addEventListener('click', close);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close();
    });
    if (onConfirm) {
      backdrop.querySelector('#susukan-modal-confirm').addEventListener('click', () => {
        const shouldClose = onConfirm(backdrop);
        if (shouldClose !== false) close();
      });
    }
    return backdrop;
  }
  window.openUniversalModal = openUniversalModal;

  function playBellChime(speechText) {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        const ctx = new Ctx();
        const now = ctx.currentTime;
        const playTone = (freq, start, duration) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0.001, start);
          gain.gain.exponentialRampToValueAtTime(0.3, start + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + duration);
        };
        playTone(659.25, now, 0.45);       // E5 (Ding)
        playTone(523.25, now + 0.38, 0.7); // C5 (Dong)
      }
      if (speechText && 'speechSynthesis' in window) {
        setTimeout(() => {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(speechText);
          utter.lang = 'id-ID';
          utter.rate = 0.95;
          window.speechSynthesis.speak(utter);
        }, 850);
      }
    } catch (e) {
      // Ignore audio errors
    }
  }
  window.playBellChime = playBellChime;

  function downloadCsv(filename, headers, rows) {
    const escapeCell = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const csvLines = [
      headers.map(escapeCell).join(','),
      ...rows.map(r => r.map(escapeCell).join(','))
    ];
    const blob = new Blob(['\uFEFF' + csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showGlobalToast('Ekspor Berhasil', `Berkas ${filename} berhasil diunduh.`);
  }

  function openOfficialLetterPrint(item) {
    const desa = APP_STATE.desaConfig || {};
    const surat = item || (APP_STATE.pengajuan && APP_STATE.pengajuan[0]) || {
      id: 'SKT-0411',
      jenisNama: 'Surat Keterangan Tidak Mampu (SKTM)',
      nomorResmi: '470 / 0411 / Kesra / IV / 2025',
      nama: 'Budi Santoso',
      nik: '3209012408010012',
      ttl: 'Cirebon, 24 Agustus 2001',
      pekerjaan: 'Mahasiswa / Belum Bekerja',
      alamat: 'RT 02 / RW 01, Dusun II, Desa Susukan',
      keperluan: 'Persyaratan Administrasi Kependudukan & Layanan Publik',
      status: 'Selesai',
      qrToken: 'BSrE-SSK-2025-0411-9F2'
    };

    openUniversalModal(
      `Lembar Surat Resmi • ${surat.id || 'Desa Susukan'}`,
      `
      <div id="printable-letter-sheet" style="font-family:Georgia,serif;padding:24px;border:1px solid #E7ECE8;border-radius:8px;background:#FFFFFF;color:#1E302D;">
        <div style="display:flex;align-items:center;gap:16px;padding-bottom:12px;border-bottom:3px double #1E302D;">
          <div style="width:56px;height:56px;border-radius:50%;background:#005144;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:bold;font-family:Inter,sans-serif;font-size:18px;flex-shrink:0;">
            DS
          </div>
          <div style="flex:1;text-align:center;font-family:Inter,sans-serif;">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#3f4945;font-weight:600;">Pemerintah ${desa.kabupaten || 'Kabupaten Cirebon'} • ${desa.kecamatan || 'Kecamatan Susukan'}</div>
            <div style="font-size:16px;text-transform:uppercase;font-weight:800;color:#005144;margin-top:2px;">Kantor Kuwu ${desa.namaDesa || 'Desa Susukan'}</div>
            <div style="font-size:11px;color:#74817D;margin-top:2px;">${desa.alamat || 'Jalan Raya Susukan No. 01 Kode Pos 45166'} • Email: ${desa.email || 'pemdes@susukan.desa.id'}</div>
          </div>
        </div>
        <div style="text-align:center;margin:18px 0;">
          <div style="font-weight:bold;text-decoration:underline;text-transform:uppercase;font-size:14px;">${surat.jenisNama || 'SURAT KETERANGAN DESA'}</div>
          <div style="font-size:12px;color:#3f4945;margin-top:4px;font-family:Inter,sans-serif;">Nomor: <strong>${surat.nomorResmi && surat.nomorResmi !== '-' ? surat.nomorResmi : '470 / 0145 / Pemdes / IV / 2025'}</strong></div>
        </div>
        <p style="font-size:12.5px;line-height:1.8;text-indent:28px;margin-bottom:12px;">
          Yang bertanda tangan di bawah ini, Kuwu ${desa.namaDesa || 'Desa Susukan'}, ${desa.kecamatan || 'Kecamatan Susukan'}, ${desa.kabupaten || 'Kabupaten Cirebon'}, menerangkan dengan sebenarnya bahwa:
        </p>
        <table style="width:100%;font-size:12.5px;line-height:1.75;margin:10px 0 14px 16px;font-family:Inter,sans-serif;">
          <tr><td style="width:160px;color:#74817D;">Nama Lengkap</td><td>: <strong>${surat.nama}</strong></td></tr>
          <tr><td style="color:#74817D;">NIK</td><td style="font-family:monospace;">: ${surat.nik}</td></tr>
          <tr><td style="color:#74817D;">Tempat / Tgl Lahir</td><td>: ${surat.ttl || 'Cirebon, 14 Mei 1997'}</td></tr>
          <tr><td style="color:#74817D;">Pekerjaan</td><td>: ${surat.pekerjaan || 'Warga Desa Susukan'}</td></tr>
          <tr><td style="color:#74817D;">Alamat Domisili</td><td>: ${surat.alamat || 'Desa Susukan, Kec. Susukan, Kab. Cirebon'}</td></tr>
        </table>
        <p style="font-size:12.5px;line-height:1.8;text-indent:28px;margin-bottom:16px;">
          Berdasarkan data administrasi kependudukan Desa Susukan, nama tersebut di atas adalah benar warga Desa Susukan yang berkelakuan baik. Surat keterangan ini diterbitkan untuk keperluan: <strong>${surat.keperluan}</strong>.
        </p>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:24px;padding-top:12px;">
          <div style="padding:8px 12px;border:1px solid #d2e7e2;border-radius:8px;background:#E8F1ED;font-family:Inter,sans-serif;max-width:230px;">
            <div style="font-size:9px;font-weight:700;color:#005144;text-transform:uppercase;">TTE Tersertifikasi BSrE BSSN</div>
            <div style="font-size:10px;color:#3f4945;margin-top:2px;">Token QR: <span style="font-family:monospace;font-weight:bold;">${surat.qrToken && surat.qrToken !== '-' ? surat.qrToken : 'BSrE-SSK-2025-VALID'}</span></div>
          </div>
          <div style="text-align:center;font-family:Inter,sans-serif;font-size:12px;">
            <div>Susukan, ${surat.tanggal || '19 April 2025'}</div>
            <div style="font-weight:bold;margin-top:2px;">Kuwu ${desa.namaDesa || 'Desa Susukan'}</div>
            <div style="margin:14px 0;padding:6px 12px;background:#E1F3EC;color:#0F5B49;border-radius:6px;font-size:10px;font-weight:bold;">
              ✓ DITANDATANGANI SECARA ELEKTRONIK
            </div>
            <div style="font-weight:bold;text-decoration:underline;">${desa.namaKuwu || "H. MA'RUF, S.Sos."}</div>
            <div style="font-size:10px;color:#74817D;">NIP. ${desa.nipKuwu || '19740512 199903 1 004'}</div>
          </div>
        </div>
      </div>
      `,
      () => {
        window.print();
        return false;
      },
      'Cetak / Simpan PDF',
      '680px'
    );
  }
  window.openOfficialLetterPrint = openOfficialLetterPrint;

  // =========================================================================
  // 3. API SYNC HELPERS
  // =========================================================================
  async function loadState() {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        APP_STATE = await res.json();
        localStorage.setItem('susukan_state_cache', JSON.stringify(APP_STATE));
      }
    } catch (e) {
      const cached = localStorage.getItem('susukan_state_cache');
      if (cached) {
        try { APP_STATE = JSON.parse(cached); } catch (_) {}
      }
    }
    return APP_STATE;
  }

  async function saveState(partial) {
    Object.assign(APP_STATE, partial);
    localStorage.setItem('susukan_state_cache', JSON.stringify(APP_STATE));
    try {
      await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial)
      });
    } catch (e) {}
  }

  // =========================================================================
  // 4. ROLE-AWARE SIDEBAR & TOPBAR WIRING
  // =========================================================================
  function setupRoleSidebarAndTopbar() {
    const aside = document.querySelector('aside');
    const isAdminScreen = /^layar_1[2-9]_/.test(SCREEN_ID);
    const isKadesScreen = /^layar_20_/.test(SCREEN_ID);
    const isWargaDesktop = /^layar_[456]_/.test(SCREEN_ID) && !SCREEN_ID.includes('mobile');

    const pendingVerifyCount = (APP_STATE.pengajuan || []).filter(p => p.status === 'Menunggu' || p.status === 'Perlu Perbaikan').length;
    const pendingWargaCount = (APP_STATE.warga || []).filter(w => w.statusAkun === 'Menunggu Verifikasi').length;
    const pendingKadesCount = (APP_STATE.pengajuan || []).filter(p => p.status === 'Disetujui' || p.status === 'Menunggu').length;

    // 4A. Admin Desa Sidebar Replacement (Design.md Section 5)
    if (aside && isAdminScreen) {
      localStorage.setItem('susukan_active_role', 'admin');
      const adminMenus = [
        {
          group: 'MANAJEMEN PELAYANAN',
          items: [
            { id: 'layar_12_verifikasi_pengajuan_petugas_admin', icon: 'fact_check', label: 'Verifikasi Pengajuan', badge: pendingVerifyCount },
            { id: 'layar_13_data_warga_kk_admin', icon: 'groups', label: 'Data Warga & KK', badge: pendingWargaCount }
          ]
        },
        {
          group: 'DATA MASTER',
          items: [
            { id: 'layar_14_jenis_syarat_surat_admin', icon: 'Rule_Folder', label: 'Jenis & Syarat Surat' },
            { id: 'layar_15_template_nomor_surat_admin', icon: 'description', label: 'Template & Nomor Surat' }
          ]
        },
        {
          group: 'LAPORAN & KOMUNIKASI',
          items: [
            { id: 'layar_16_laporan_buku_register_admin', icon: 'menu_book', label: 'Laporan & Buku Register' },
            { id: 'layar_17_komunikasi_whatsapp_log_notifikasi_admin', icon: 'chat', label: 'WhatsApp & Template' }
          ]
        },
        {
          group: 'PENGATURAN & LOKET',
          items: [
            { id: 'layar_18_audit_log_keamanan_sistem_admin', icon: 'security', label: 'Audit Log & Keamanan' },
            { id: 'layar_19_profil_desa_pengaturan_kop_surat_admin', icon: 'settings', label: 'Profil Desa & Backup' },
            { id: 'layar_operator_loket_panel_kendali_pemanggilan_antrean_cetak_e_ktp', icon: 'campaign', label: 'Loket Antrean e-KTP' }
          ]
        }
      ];

      aside.innerHTML = `
        <div class="flex flex-col overflow-y-auto flex-1">
          <div class="h-16 px-4 flex items-center gap-2 bg-primary/40 shrink-0">
            <div class="w-9 h-9 rounded-lg bg-[#E8B95B] text-[#0F3D3E] flex items-center justify-center font-bold">
              <span class="material-symbols-outlined text-[20px]">shield_person</span>
            </div>
            <div class="flex flex-col">
              <span class="font-bold text-[15px] text-white leading-tight">${APP_STATE.desaConfig?.namaDesa || 'Desa Susukan'}</span>
              <span class="text-[10px] font-bold text-[#E8B95B] uppercase tracking-wider">Portal Operator Admin</span>
            </div>
          </div>
          <div class="p-3 flex flex-col gap-3">
            ${adminMenus.map(g => `
              <div>
                <div class="text-white/50 text-[10px] font-bold uppercase tracking-wider px-2.5 mb-1">${g.group}</div>
                <nav class="flex flex-col gap-1">
                  ${g.items.map(item => {
                    const active = SCREEN_ID === item.id;
                    return `
                      <a href="/screen/${item.id}" class="flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] transition-all ${
                        active
                          ? 'bg-[#E8B95B] text-[#0F3D3E] font-bold shadow-sm'
                          : 'text-white/85 hover:bg-white/10 hover:text-white font-medium'
                      }">
                        <span class="flex items-center gap-2.5 truncate">
                          <span class="material-symbols-outlined text-[18px]">${item.icon.toLowerCase()}</span>
                          <span class="truncate">${item.label}</span>
                        </span>
                        ${item.badge ? `<span class="px-1.5 py-0.5 text-[10px] font-bold rounded-full ${active ? 'bg-[#0F3D3E] text-white' : 'bg-[#D64545] text-white'}">${item.badge}</span>` : ''}
                      </a>
                    `;
                  }).join('')}
                </nav>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="p-3 bg-black/20 flex flex-col gap-2">
          <div class="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white/10 text-white text-[12px]">
            <div class="flex flex-col truncate">
              <span class="font-semibold truncate">Bpk. Agus Setiawan</span>
              <span class="text-[10px] text-white/70">Admin / Kasi Pelayanan</span>
            </div>
            <a href="/screen/layar_1_masuk_autentikasi_warga" title="Keluar / Ganti Peran" class="p-1.5 rounded-lg bg-[#D64545]/80 hover:bg-[#D64545] text-white flex items-center">
              <span class="material-symbols-outlined text-[16px]">logout</span>
            </a>
          </div>
        </div>
      `;

      // Update Topbar user info on Admin screens if Siti Rahayu placeholder is present
      const topbarHeader = document.querySelector('header.fixed');
      if (topbarHeader) {
        topbarHeader.innerHTML = topbarHeader.innerHTML
          .replace('Siti Rahayu', 'Bpk. Agus Setiawan')
          .replace('320901******0004', 'NIP. 19850315 201001 1 002')
          .replace('>Warga<', '>Admin Desa<');
      }
    }

    // 4B. Warga Desktop Sidebar Wiring
    if (aside && isWargaDesktop) {
      localStorage.setItem('susukan_active_role', 'warga');
      const pathMap = {
        'dashboard-pelayanan': '/screen/layar_4_dashboard_warga_pelacakan_surat',
        'pengajuan-surat': '/screen/layar_5_formulir_pengajuan_surat',
        'riwayat-permohonan': '/screen/layar_6_riwayat_pengajuan_warga',
        'arsip-dokumen': '/screen/layar_6_mobile_pratinjau_lembar_surat_pdf',
        'profil-warga': '#modal-data-keluarga',
        'pusat-bantuan': '/screen/layar_pusat_bantuan_digital_chatbot_interaktif_pelayanan_warga'
      };
      aside.querySelectorAll('a[data-path]').forEach(a => {
        const dp = a.getAttribute('data-path');
        if (pathMap[dp]) {
          a.setAttribute('href', pathMap[dp]);
          if (pathMap[dp] === '#modal-data-keluarga') {
            a.addEventListener('click', (e) => {
              e.preventDefault();
              openWargaFamilyModal();
            });
          }
        }
      });
      // Add Cetak Ulang e-KTP & Logout link at bottom of Warga sidebar
      const bottomBox = aside.lastElementChild;
      if (bottomBox && !bottomBox.querySelector('.susukan-logout-link')) {
        const extra = document.createElement('div');
        extra.className = 'mt-2 pt-2 border-t border-white/15 flex flex-col gap-1.5';
        extra.innerHTML = `
          <a href="/screen/layar_mobile_formulir_cetak_ulang_e_ktp_rusak" class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[12px] font-medium">
            <span class="material-symbols-outlined text-[16px]">badge</span>
            <span>Pengantar Cetak e-KTP</span>
          </a>
          <a href="/screen/layar_1_masuk_autentikasi_warga" class="susukan-logout-link flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#D64545]/80 hover:bg-[#D64545] text-white text-[12px] font-semibold">
            <span class="material-symbols-outlined text-[16px]">logout</span>
            <span>Keluar Akun</span>
          </a>
        `;
        bottomBox.appendChild(extra);
      }
    }

    // 4C. Kades Sidebar Wiring
    if (aside && isKadesScreen) {
      localStorage.setItem('susukan_active_role', 'kades');
      aside.querySelectorAll('a').forEach(a => {
        const txt = a.textContent.toLowerCase();
        if (txt.includes('menunggu persetujuan')) {
          a.href = '/screen/layar_20_persetujuan_kepala_desa_kades';
        } else if (txt.includes('surat disetujui') || txt.includes('buku register')) {
          a.href = '/screen/layar_16_laporan_buku_register_admin';
        } else if (txt.includes('pengaturan tte')) {
          a.href = '/screen/layar_19_profil_desa_pengaturan_kop_surat_admin';
        }
      });
      const bottomBox = aside.lastElementChild;
      if (bottomBox && !bottomBox.querySelector('.susukan-logout-link')) {
        const logoutBtn = document.createElement('a');
        logoutBtn.href = '/screen/layar_1_masuk_autentikasi_warga';
        logoutBtn.className = 'susukan-logout-link mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#D64545] text-white text-[12px] font-semibold hover:opacity-90';
        logoutBtn.innerHTML = `<span class="material-symbols-outlined text-[16px]">logout</span><span>Keluar Kuwu (${pendingKadesCount} Antrean)</span>`;
        bottomBox.appendChild(logoutBtn);
      }
    }

    // 4D. Other Sidebars (Loket Kecamatan & Portal Eksekutif)
    if (aside && !isAdminScreen && !isWargaDesktop && !isKadesScreen) {
      aside.querySelectorAll('a').forEach(a => {
        const txt = a.textContent.toLowerCase();
        if (txt.includes('panel pemanggilan')) a.href = '/screen/layar_operator_loket_panel_kendali_pemanggilan_antrean_cetak_e_ktp';
        else if (txt.includes('antrean hari ini')) a.href = '/screen/layar_operator_loket_respons_konfirmasi_kehadiran_warga_a_038';
        else if (txt.includes('riwayat pelayanan') || txt.includes('dashboard')) a.href = '/screen/layar_dashboard_rekapitulasi_harian_aktivasi_ikd_kecamatan_susukan';
        else if (txt.includes('monitoring blangko')) a.href = '/screen/layar_monitoring_stok_blangko_e_ktp_logistik_percetakan';
        else if (txt.includes('bantuan')) a.href = '/screen/layar_pusat_bantuan_digital_chatbot_interaktif_pelayanan_warga';
        else if (txt.includes('daftar pengajuan')) a.href = '/screen/layar_12_verifikasi_pengajuan_petugas_admin';
        else if (txt.includes('verifikasi dokumen') || txt.includes('arsip & legalisir')) a.href = '/screen/layar_pusat_arsip_digital_validasi_dokumen_kependudukan';
        else if (txt.includes('database warga')) a.href = '/screen/layar_13_data_warga_kk_admin';
        else if (txt.includes('laporan pelayanan')) a.href = '/screen/layar_manajemen_kinerja_petugas_evaluasi_kpi_loket';
        else if (txt.includes('konfigurasi wilayah')) a.href = '/screen/layar_peta_interaktif_demografi_gis_wilayah_kecamatan_susukan';
      });
    }

    // 4E. Mobile Bottom Nav & Back Buttons
    document.querySelectorAll('nav a, footer a, div a').forEach(a => {
      const txt = a.textContent.trim().toLowerCase();
      if (txt === 'beranda' || txt === 'dashboardberanda') {
        a.href = SCREEN_ID.includes('mobile')
          ? '/screen/layar_4_mobile_dashboard_pelacakan_warga'
          : '/screen/layar_4_dashboard_warga_pelacakan_surat';
      } else if (txt === 'ajukan' || txt === 'post_addajukan') {
        a.href = '/screen/layar_5_mobile_formulir_pengajuan_surat';
      } else if (txt === 'riwayat' || txt === 'historyriwayat') {
        a.href = '/screen/layar_6_mobile_riwayat_unduh_surat_warga';
      } else if (txt === 'akun' || txt === 'account_circleakun') {
        a.href = '#akun';
        a.addEventListener('click', (e) => {
          e.preventDefault();
          openWargaFamilyModal();
        });
      }
    });

    // Inject Mobile Hamburger Button in Topbar if aside exists
    const topHeader = document.querySelector('header');
    if (aside && topHeader && !document.getElementById('susukan-hamburger-btn')) {
      const firstChild = topHeader.firstElementChild;
      if (firstChild) {
        const btn = document.createElement('button');
        btn.id = 'susukan-hamburger-btn';
        btn.type = 'button';
        btn.className = 'md:hidden mr-2 p-2 rounded-lg bg-bg-ivory text-on-surface hover:bg-mint-tag cursor-pointer';
        btn.innerHTML = '<span class="material-symbols-outlined">menu</span>';
        btn.addEventListener('click', () => {
          aside.classList.toggle('mobile-drawer-open');
        });
        firstChild.prepend(btn);
      }
    }

    // Wire Topbar Search Input (remove readonly so it filters tables, and Ctrl+K opens Navigator)
    document.querySelectorAll('header input[type="text"]').forEach(inp => {
      inp.removeAttribute('readonly');
      inp.addEventListener('input', (e) => {
        filterVisibleTables(e.target.value);
      });
    });

    // Wire Notification Bell Buttons across all headers
    document.querySelectorAll('button').forEach(btn => {
      const iconText = btn.textContent.trim();
      if (iconText === 'notifications' || btn.querySelector('.material-symbols-outlined')?.textContent.trim() === 'notifications') {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          // Hide red dot badge when opened (Design.md rule)
          const badgeDot = btn.querySelector('span.bg-error, span.bg-red-500, span.rounded-full:not(.material-symbols-outlined)');
          if (badgeDot) badgeDot.style.display = 'none';
          openNotificationsModal();
        });
      }
    });
  }

  function openWargaFamilyModal() {
    const wargaList = APP_STATE.warga || [];
    openUniversalModal(
      'Data Keluarga & Profil Warga Terdaftar (KK Desa Susukan)',
      `
      <div class="space-y-4">
        <div class="p-3.5 rounded-xl bg-[#E8F1ED] flex items-center justify-between">
          <div>
            <div class="text-[11px] font-bold uppercase text-[#005144]">No. Kartu Keluarga Terintegrasi SIAK</div>
            <div class="font-mono font-bold text-[15px] text-[#1E302D]">3209012304000004 • Kepala KK: Siti Aminah</div>
            <div class="text-[12px] text-[#3f4945]">Alamat: RT 02 / RW 01, Dusun II, Desa Susukan</div>
          </div>
          <a href="/screen/layar_1_masuk_autentikasi_warga" class="px-3 py-1.5 rounded-lg bg-[#D64545] text-white text-[12px] font-semibold">Ganti Akun</a>
        </div>
        <div class="space-y-2">
          <div class="font-bold text-[13px] text-[#1E302D]">Daftar Anggota Keluarga dalam KK:</div>
          ${wargaList.slice(0, 4).map(w => `
            <div class="p-3 rounded-xl border border-[#E7ECE8] flex items-center justify-between">
              <div>
                <div class="font-bold text-[13px]">${w.nama} <span class="text-[11px] font-normal text-[#74817D]">(${w.hubungan})</span></div>
                <div class="font-mono text-[12px] text-[#74817D]">NIK: ${w.nik.slice(0, 6)}******${w.nik.slice(-4)} • ${w.pekerjaan || 'Warga'}</div>
              </div>
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E1F3EC] text-[#176B5B]">${w.statusAkun}</span>
            </div>
          `).join('')}
        </div>
      </div>
      `,
      null
    );
  }

  function openNotificationsModal() {
    const notifs = APP_STATE.notifications || [];
    notifs.forEach(n => { n.unread = false; });
    saveState({ notifications: notifs });

    openUniversalModal(
      'Pusat Notifikasi Layanan Desa Susukan',
      `
      <div class="space-y-2.5">
        ${notifs.length === 0 ? '<p class="text-center text-[#74817D] py-4">Belum ada notifikasi baru.</p>' : notifs.map(n => `
          <a href="/screen/${n.targetScreen || 'layar_6_riwayat_pengajuan_warga'}" class="block p-3.5 rounded-xl border border-[#E7ECE8] hover:bg-[#E8F1ED] transition-colors">
            <div class="flex items-center justify-between">
              <span class="font-bold text-[13px] text-[#005144]">${n.title}</span>
              <span class="text-[11px] text-[#74817D]">${n.time}</span>
            </div>
            <p class="text-[12.5px] text-[#3f4945] mt-1 mb-0">${n.message}</p>
          </a>
        `).join('')}
      </div>
      `
    );
  }

  function filterVisibleTables(query) {
    const q = (query || '').trim().toLowerCase();
    document.querySelectorAll('table tbody tr').forEach(tr => {
      const txt = tr.textContent.toLowerCase();
      tr.style.display = !q || txt.includes(q) ? '' : 'none';
    });
  }

  // =========================================================================
  // 5. SCREEN-SPECIFIC LOGIC
  // =========================================================================

  // --- 5.1 LOGIN & REGISTER (`layar_1_masuk_autentikasi_warga`) ---
  function initLoginScreen() {
    if (SCREEN_ID !== 'layar_1_masuk_autentikasi_warga') return;

    // Override simulateLogin with real API authentication + role redirect
    window.simulateLogin = async function () {
      const identifier = document.getElementById('identifier-input')?.value.trim();
      const password = document.getElementById('password-input')?.value;
      const submitBtn = document.getElementById('btn-submit');
      const btnText = document.getElementById('btn-text');
      const btnIcon = document.getElementById('btn-icon');

      if (submitBtn) submitBtn.disabled = true;
      if (btnText) btnText.textContent = 'Memverifikasi Kredensial...';
      if (btnIcon) {
        btnIcon.textContent = 'sync';
        btnIcon.classList.add('animate-spin');
      }

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password, role: window.activeRole || 'warga' })
        });
        const data = await res.json();

        if (!res.ok || !data.ok) {
          showGlobalToast('Gagal Masuk', data.message || 'Periksa kembali NIK/Username dan Kata Sandi.', 'error');
          if (submitBtn) submitBtn.disabled = false;
          if (btnText) btnText.textContent = 'Masuk ke Layanan';
          if (btnIcon) {
            btnIcon.textContent = 'arrow_forward';
            btnIcon.classList.remove('animate-spin');
          }
          return;
        }

        localStorage.setItem('susukan_user', JSON.stringify(data.user));
        localStorage.setItem('susukan_active_role', data.user.role);
        showGlobalToast('Autentikasi Berhasil!', `Selamat datang, ${data.user.nama}. Mengalihkan ke dashboard...`);
        setTimeout(() => {
          window.location.href = data.redirectUrl;
        }, 700);
      } catch (err) {
        showGlobalToast('Mode Offline Aktif', 'Mengalihkan ke Dashboard Layanan...');
        const r = window.activeRole || 'warga';
        setTimeout(() => {
          window.location.href = r === 'admin'
            ? '/screen/layar_12_verifikasi_pengajuan_petugas_admin'
            : r === 'kades'
              ? '/screen/layar_20_persetujuan_kepala_desa_kades'
              : '/screen/layar_4_dashboard_warga_pelacakan_surat';
        }, 600);
      }
    };

    // Override startRegistration with full Citizen Registration Form Modal
    window.startRegistration = function () {
      openUniversalModal(
        'Pendaftaran Akun Mandiri Warga Desa Susukan',
        `
        <div class="space-y-3">
          <div>
            <label class="block text-[12px] font-bold mb-1">Nomor Induk Kependudukan (NIK 16 Digit) *</label>
            <input id="reg-nik" type="text" maxlength="16" placeholder="Contoh: 3209011508990007" class="w-full h-10 px-3 rounded-lg border border-[#E7ECE8] bg-[#F7F8F5] font-mono text-[13px]" />
          </div>
          <div>
            <label class="block text-[12px] font-bold mb-1">Nama Lengkap Sesuai e-KTP *</label>
            <input id="reg-nama" type="text" placeholder="Masukkan nama lengkap" class="w-full h-10 px-3 rounded-lg border border-[#E7ECE8] bg-[#F7F8F5] text-[13px]" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[12px] font-bold mb-1">Nomor Kartu Keluarga (KK)</label>
              <input id="reg-kk" type="text" maxlength="16" placeholder="16 Digit No. KK" class="w-full h-10 px-3 rounded-lg border border-[#E7ECE8] bg-[#F7F8F5] font-mono text-[13px]" />
            </div>
            <div>
              <label class="block text-[12px] font-bold mb-1">Nomor WhatsApp Aktif *</label>
              <input id="reg-wa" type="text" placeholder="0812xxxxxxxx (Otomatis 62...)" class="w-full h-10 px-3 rounded-lg border border-[#E7ECE8] bg-[#F7F8F5] font-mono text-[13px]" />
            </div>
          </div>
          <div>
            <label class="block text-[12px] font-bold mb-1">Alamat RT / RW & Dusun</label>
            <input id="reg-alamat" type="text" placeholder="Contoh: RT 02 / RW 01, Dusun II, Desa Susukan" class="w-full h-10 px-3 rounded-lg border border-[#E7ECE8] bg-[#F7F8F5] text-[13px]" />
          </div>
          <div>
            <label class="block text-[12px] font-bold mb-1">Buat Kata Sandi Akun *</label>
            <input id="reg-pass" type="password" placeholder="Minimal 6 karakter" value="warga123" class="w-full h-10 px-3 rounded-lg border border-[#E7ECE8] bg-[#F7F8F5] text-[13px]" />
          </div>
          <label class="flex items-start gap-2 pt-1 cursor-pointer">
            <input id="reg-privasi" type="checkbox" checked class="mt-1 accent-[#176B5B]" />
            <span class="text-[12px] text-[#3f4945]">Saya menyetujui kebijakan privasi perlindungan data kependudukan sesuai UU PDP No. 27 Tahun 2022.</span>
          </label>
        </div>
        `,
        async (modal) => {
          const nik = modal.querySelector('#reg-nik').value.trim();
          const nama = modal.querySelector('#reg-nama').value.trim();
          const noKk = modal.querySelector('#reg-kk').value.trim();
          const noHp = modal.querySelector('#reg-wa').value.trim();
          const alamat = modal.querySelector('#reg-alamat').value.trim();
          const password = modal.querySelector('#reg-pass').value;
          const setujuPrivasi = modal.querySelector('#reg-privasi').checked;

          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nik, nama, noKk, noHp, alamat, password, setujuPrivasi })
          });
          const data = await res.json();
          if (!res.ok || !data.ok) {
            showGlobalToast('Validasi Gagal', data.message || 'Data pendaftaran belum lengkap.', 'error');
            return false;
          }
          showGlobalToast('Pendaftaran Berhasil!', data.message);
          // Switch back to login tab and prefill NIK
          if (typeof window.switchMainTab === 'function') window.switchMainTab('login');
          const idInput = document.getElementById('identifier-input');
          const passInput = document.getElementById('password-input');
          if (idInput) idInput.value = nik;
          if (passInput) passInput.value = password;
          return true;
        },
        'Daftarkan Akun Warga'
      );
    };

    // Wire "Lupa sandi? Reset via WA" link to interactive OTP modal (Design.md Section 7)
    const resetLink = document.querySelector('a[href*="wa.me"]');
    if (resetLink) {
      resetLink.addEventListener('click', (e) => {
        e.preventDefault();
        const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
        showGlobalToast('OTP WhatsApp Terkirim (Demo)', `Kode OTP Reset Sandi Anda: ${generatedOtp}`);
        openUniversalModal(
          'Pemulihan Kata Sandi via OTP WhatsApp',
          `
          <div class="space-y-3">
            <div class="p-3 rounded-xl bg-[#E8F1ED] text-[12.5px] text-[#005144]">
              Kode OTP 6 digit telah dikirimkan ke WhatsApp terdaftar. <strong>(Kode Demo: <span class="font-mono underline">${generatedOtp}</span>)</strong>
            </div>
            <div>
              <label class="block text-[12px] font-bold mb-1">NIK / Username Akun</label>
              <input id="otp-user" type="text" value="${document.getElementById('identifier-input')?.value || '3209010101010001'}" class="w-full h-10 px-3 rounded-lg border border-[#E7ECE8] bg-[#F7F8F5] font-mono text-[13px]" />
            </div>
            <div>
              <label class="block text-[12px] font-bold mb-1">Masukkan Kode OTP WhatsApp</label>
              <input id="otp-code" type="text" value="${generatedOtp}" class="w-full h-10 px-3 rounded-lg border border-[#E7ECE8] bg-[#F7F8F5] font-mono font-bold text-[15px] tracking-widest" />
            </div>
            <div>
              <label class="block text-[12px] font-bold mb-1">Kata Sandi Baru</label>
              <input id="otp-newpass" type="password" value="warga123" class="w-full h-10 px-3 rounded-lg border border-[#E7ECE8] bg-[#F7F8F5] text-[13px]" />
            </div>
          </div>
          `,
          (modal) => {
            const newPass = modal.querySelector('#otp-newpass').value;
            const passInput = document.getElementById('password-input');
            if (passInput && newPass) passInput.value = newPass;
            showGlobalToast('Kata Sandi Diperbarui', 'Silakan masuk menggunakan kata sandi baru Anda.');
            return true;
          },
          'Simpan Kata Sandi Baru'
        );
      });
    }
  }

  // --- 5.2 WARGA DASHBOARD (`layar_4_dashboard_warga_pelacakan_surat` & Mobile) ---
  function initWargaDashboard() {
    if (SCREEN_ID !== 'layar_4_dashboard_warga_pelacakan_surat' && SCREEN_ID !== 'layar_4_mobile_dashboard_pelacakan_warga') return;

    // Prepend any newly created submissions from APP_STATE.pengajuan into table if on desktop
    const tbody = document.querySelector('table tbody');
    if (tbody && APP_STATE.pengajuan && APP_STATE.pengajuan.length > 0) {
      const existingIds = new Set(
        [...tbody.querySelectorAll('tr')].map(tr => tr.textContent.match(/[A-Z]{2,4}-\d{3,4}/)?.[0]).filter(Boolean)
      );
      APP_STATE.pengajuan.forEach(item => {
        if (!existingIds.has(item.id)) {
          const badgeClass =
            item.status === 'Selesai' || item.status === 'Disetujui'
              ? 'bg-status-selesai-bg text-status-selesai-text'
              : item.status === 'Perlu Perbaikan'
                ? 'bg-status-perbaikan-bg text-status-perbaikan-text'
                : 'bg-status-menunggu-bg text-status-menunggu-text';
          const tr = document.createElement('tr');
          tr.className = 'hover:bg-mint-tag transition-colors';
          tr.innerHTML = `
            <td class="py-4 px-space-lg">
              <span class="font-label-md text-label-md text-on-surface">${item.id}</span>
              <span class="block font-label-sm text-label-sm text-text-muted">Pelayanan Mandiri</span>
            </td>
            <td class="py-4 px-space-lg">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-lg">description</span>
                <span class="font-label-lg text-label-lg text-on-surface">${item.jenisNama}</span>
              </div>
            </td>
            <td class="py-4 px-space-lg font-body-sm text-body-sm text-on-surface">${item.tanggal}</td>
            <td class="py-4 px-space-lg font-body-sm text-body-sm text-text-muted max-w-xs truncate">${item.keperluan}</td>
            <td class="py-4 px-space-lg">
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm ${badgeClass}">
                <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                ${item.status}
              </span>
            </td>
            <td class="py-4 px-space-lg text-right">
              <button type="button" class="susukan-detail-btn px-3 py-1.5 rounded-lg bg-surface-container-low text-primary font-label-sm text-label-sm hover:bg-surface-container transition-colors cursor-pointer" data-id="${item.id}">
                ${item.status === 'Selesai' ? 'Unduh PDF' : item.status === 'Perlu Perbaikan' ? 'Perbaiki Berkas' : 'Lihat Detail'}
              </button>
            </td>
          `;
          tbody.prepend(tr);
        }
      });
    }

    // Search input in table card
    document.querySelectorAll('input[placeholder*="Cari"]').forEach(inp => {
      inp.addEventListener('input', (e) => filterVisibleTables(e.target.value));
    });
  }

  // --- 5.3 FORMULIR PENGAJUAN SURAT (`layar_5_formulir_pengajuan_surat` & Mobile) ---
  function initFormulirPengajuan() {
    if (!SCREEN_ID.includes('formulir_pengajuan_surat') && !SCREEN_ID.includes('cetak_ulang_e_ktp')) return;

    // Populate custom letter types if added in Admin
    const jenisSelect = document.getElementById('jenisSurat');
    if (jenisSelect && APP_STATE.jenisSurat?.length) {
      const existingValues = new Set([...jenisSelect.options].map(o => o.value));
      APP_STATE.jenisSurat.forEach(j => {
        if (!existingValues.has(j.id)) {
          const opt = document.createElement('option');
          opt.value = j.id;
          opt.textContent = j.nama;
          jenisSelect.appendChild(opt);
        }
      });
    }

    // Override handleFormSubmit on desktop form
    const origSubmit = window.handleFormSubmit;
    window.handleFormSubmit = async function () {
      const select = document.getElementById('jenisSurat');
      const jenisId = select ? select.value : 'domisili';
      const jenisNama = select ? select.options[select.selectedIndex].text : 'Surat Keterangan Domisili';
      const keperluan = document.getElementById('keperluanSurat')?.value.trim() || 'Keperluan Administrasi Warga Desa Susukan';

      if (typeof origSubmit === 'function') origSubmit();

      const res = await fetch('/api/pengajuan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          jenisId,
          jenisNama,
          nama: 'Siti Aminah',
          nik: '3209010101010004',
          keperluan
        })
      });
      if (res.ok) {
        const data = await res.json();
        showGlobalToast('Pengajuan Terkirim!', `Nomor Registrasi: ${data.item.id}. Mengalihkan ke Riwayat Pengajuan...`);
        setTimeout(() => {
          window.location.href = '/screen/layar_6_riwayat_pengajuan_warga';
        }, 1200);
      }
    };
  }

  // --- 5.4 VERIFIKASI PENGAJUAN ADMIN (`layar_12_verifikasi_pengajuan_petugas_admin`) ---
  function initAdminVerification() {
    if (SCREEN_ID !== 'layar_12_verifikasi_pengajuan_petugas_admin') return;

    let selectedId = 'SKT-0411';

    function renderSelectedSubmission(id) {
      selectedId = id;
      const item = (APP_STATE.pengajuan || []).find(p => p.id === id);
      if (!item) return;

      const detailTitle = document.getElementById('detailTitle');
      if (detailTitle) detailTitle.textContent = `Detail Berkas ${item.id}`;
      const nikDisplay = document.getElementById('nikDisplay');
      if (nikDisplay) nikDisplay.textContent = `${item.nik.slice(0, 6)}••••${item.nik.slice(-4)}`;

      // Update letter preview below
      const paperCard = document.querySelector('.font-letter-legal-body');
      if (paperCard) {
        paperCard.innerHTML = paperCard.innerHTML
          .replace(/Budi Santoso/g, item.nama)
          .replace(/3209012408010012/g, item.nik)
          .replace(/Surat Keterangan Tidak Mampu/gi, item.jenisNama);
      }
    }

    document.querySelectorAll('.queue-row').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.getAttribute('data-id');
        if (id) renderSelectedSubmission(id);
      });
    });

    // Override handleAction to persist to backend API and update row badge live!
    window.handleAction = async function (type) {
      const notesEl = document.getElementById('operatorNotes');
      const catatan = notesEl ? notesEl.value.trim() : '';

      if ((type === 'perbaikan' || type === 'tolak') && !catatan) {
        showGlobalToast('Alasan Wajib Diisi!', 'Mohon tuliskan alasan perbaikan atau penolakan pada kolom catatan.', 'warning');
        if (notesEl) notesEl.focus();
        return;
      }

      if (type === 'tolak') {
        if (!confirm(`Apakah Anda yakin ingin MENOLAK pengajuan ${selectedId}?`)) return;
      }

      const newStatus =
        type === 'setujui' ? 'Disetujui' :
        type === 'perbaikan' ? 'Perlu Perbaikan' : 'Ditolak';

      await fetch('/api/pengajuan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateStatus',
          id: selectedId,
          status: newStatus,
          catatan,
          aktor: 'Bpk. Agus Setiawan (Admin)'
        })
      });

      // Update badge in table row
      const activeRow = document.querySelector(`.queue-row[data-id="${selectedId}"]`);
      if (activeRow) {
        const statusCell = activeRow.querySelector('td:last-child');
        if (statusCell) {
          const cls =
            newStatus === 'Disetujui' ? 'bg-status-disetujui-bg text-status-disetujui-text' :
            newStatus === 'Perlu Perbaikan' ? 'bg-status-perbaikan-bg text-status-perbaikan-text' :
            'bg-status-ditolak-bg text-status-ditolak-text';
          statusCell.innerHTML = `<span class="inline-flex px-2 py-0.5 rounded-full font-label-sm text-label-sm ${cls} whitespace-nowrap">${newStatus}</span>`;
        }
      }

      if (type === 'setujui') {
        showGlobalToast('Berkas Disetujui!', `Berkas ${selectedId} diteruskan ke antrean TTE Kuwu / Kepala Desa.`);
      } else if (type === 'perbaikan') {
        showGlobalToast('Notifikasi Revisi Terkirim', `Permintaan perbaikan ${selectedId} telah dikirim ke WhatsApp warga.`, 'warning');
      } else {
        showGlobalToast('Pengajuan Ditolak', `Berkas ${selectedId} telah ditolak dan dicatat di Audit Log.`, 'error');
      }
    };
  }

  // --- 5.5 DATA WARGA & KK ADMIN (`layar_13_data_warga_kk_admin`) ---
  function initDataWargaScreen() {
    if (SCREEN_ID !== 'layar_13_data_warga_kk_admin') return;

    const searchInput = document.querySelector('input[placeholder*="Cari NIK"]');
    const dusunSelect = document.querySelector('select');
    const tbody = document.querySelector('table tbody');

    if (searchInput) {
      searchInput.addEventListener('input', () => filterVisibleTables(searchInput.value));
    }
    if (dusunSelect) {
      dusunSelect.addEventListener('change', () => {
        const val = dusunSelect.value;
        if (val === 'all') filterVisibleTables('');
        else if (val === 'dusun1') filterVisibleTables('dusun i');
        else if (val === 'dusun2') filterVisibleTables('dusun ii');
        else if (val === 'dusun3') filterVisibleTables('dusun iii');
      });
    }

    // Wire buttons in layar_13
    document.querySelectorAll('button').forEach(btn => {
      const txt = btn.textContent.replace(/\s+/g, ' ').trim();

      if (txt.includes('Unduh Template')) {
        btn.addEventListener('click', () => {
          downloadCsv(
            'template_data_warga_desa_susukan.csv',
            ['NIK', 'Nama_Lengkap', 'No_KK', 'Hubungan_Keluarga', 'Jenis_Kelamin', 'Usia', 'Alamat_RT_RW_Dusun', 'No_WhatsApp', 'Status_Akun'],
            [
              ['3209010101010004', 'Siti Aminah', '3209012304000004', 'Kepala KK', 'Perempuan', '28', 'RT 02 / RW 01 Dusun II', '6281234568891', 'Aktif'],
              ['3209012408010012', 'Budi Santoso', '3209012304000012', 'Kepala KK', 'Laki-laki', '34', 'RT 01 / RW 03 Dusun I', '6285712344211', 'Menunggu Verifikasi']
            ]
          );
        });
      } else if (txt.includes('Impor CSV/Excel')) {
        btn.addEventListener('click', () => {
          const fileInp = document.createElement('input');
          fileInp.type = 'file';
          fileInp.accept = '.csv,.txt,.xlsx';
          fileInp.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              const lines = String(reader.result || '').split(/\r?\n/).filter(Boolean);
              const importedCount = Math.max(1, lines.length - 1);
              showGlobalToast('Impor CSV Berhasil', `${importedCount} data warga dari "${file.name}" berhasil disinkronkan ke tabel.`);
            };
            reader.readAsText(file);
          });
          fileInp.click();
        });
      } else if (txt.includes('Tambah Warga Baru')) {
        btn.addEventListener('click', () => {
          openUniversalModal(
            'Tambah Data Warga & Kartu Keluarga Baru',
            `
            <div class="space-y-3">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[12px] font-bold mb-1">NIK (16 Digit) *</label>
                  <input id="add-warga-nik" type="text" maxlength="16" placeholder="320901xxxxxxxxxx" class="w-full h-10 px-3 rounded-lg border border-[#E7ECE8] bg-[#F7F8F5] font-mono text-[13px]" />
                </div>
                <div>
                  <label class="block text-[12px] font-bold mb-1">Nomor KK (16 Digit) *</label>
                  <input id="add-warga-kk" type="text" maxlength="16" placeholder="320901230400xxxx" class="w-full h-10 px-3 rounded-lg border border-[#E7ECE8] bg-[#F7F8F5] font-mono text-[13px]" />
                </div>
              </div>
              <div>
                <label class="block text-[12px] font-bold mb-1">Nama Lengkap Warga *</label>
                <input id="add-warga-nama" type="text" placeholder="Contoh: Hendra Wijaya" class="w-full h-10 px-3 rounded-lg border border-[#E7ECE8] bg-[#F7F8F5] text-[13px]" />
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-[12px] font-bold mb-1">Jenis Kelamin</label>
                  <select id="add-warga-jk" class="w-full h-10 px-3 rounded-lg border border-[#E7ECE8] bg-[#F7F8F5] text-[13px]">
                    <option>Laki-laki</option>
                    <option>Perempuan</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[12px] font-bold mb-1">Usia (Tahun)</label>
                  <input id="add-warga-usia" type="number" value="30" class="w-full h-10 px-3 rounded-lg border border-[#E7ECE8] bg-[#F7F8F5] text-[13px]" />
                </div>
                <div>
                  <label class="block text-[12px] font-bold mb-1">Status dalam KK</label>
                  <select id="add-warga-hub" class="w-full h-10 px-3 rounded-lg border border-[#E7ECE8] bg-[#F7F8F5] text-[13px]">
                    <option>Kepala KK</option>
                    <option>Anggota</option>
                  </select>
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[12px] font-bold mb-1">Alamat RT/RW & Dusun</label>
                  <input id="add-warga-alamat" type="text" value="RT 02 / RW 01 Dusun II" class="w-full h-10 px-3 rounded-lg border border-[#E7ECE8] bg-[#F7F8F5] text-[13px]" />
                </div>
                <div>
                  <label class="block text-[12px] font-bold mb-1">Nomor WhatsApp</label>
                  <input id="add-warga-wa" type="text" placeholder="0812-xxxx-xxxx" class="w-full h-10 px-3 rounded-lg border border-[#E7ECE8] bg-[#F7F8F5] font-mono text-[13px]" />
                </div>
              </div>
            </div>
            `,
            (modal) => {
              const nik = modal.querySelector('#add-warga-nik').value.trim() || '3209011904950044';
              const noKk = modal.querySelector('#add-warga-kk').value.trim() || '3209012304000044';
              const nama = modal.querySelector('#add-warga-nama').value.trim() || 'Warga Baru Susukan';
              const jk = modal.querySelector('#add-warga-jk').value;
              const usia = modal.querySelector('#add-warga-usia').value || '30';
              const hub = modal.querySelector('#add-warga-hub').value;
              const alamat = modal.querySelector('#add-warga-alamat').value.trim();
              const wa = modal.querySelector('#add-warga-wa').value.trim() || '0812-8899-0011';
              const initials = nama.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();

              if (tbody) {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-mint-tag/60 transition-colors group';
                tr.innerHTML = `
                  <td class="py-3.5 px-space-md align-middle">
                    <div class="flex flex-col gap-0.5">
                      <span class="font-label-md text-label-md text-on-surface font-mono tracking-tight">${nik.slice(0, 4)}••••${nik.slice(-4)}</span>
                      <span class="inline-block px-1.5 py-0.5 rounded bg-surface-container text-primary-container text-[10px] font-label-eyebrow uppercase font-bold w-max">${hub}</span>
                    </div>
                  </td>
                  <td class="py-3.5 px-space-md align-middle">
                    <div class="flex items-center gap-space-xs">
                      <div class="w-8 h-8 rounded-full bg-surface-container-high text-primary flex items-center justify-center font-label-md text-label-md font-bold">${initials}</div>
                      <div class="flex flex-col">
                        <span class="font-label-md text-label-md text-on-surface">${nama}</span>
                        <span class="font-body-sm text-body-sm text-text-muted text-[11px]">${jk} • ${usia} Thn</span>
                      </div>
                    </div>
                  </td>
                  <td class="py-3.5 px-space-md align-middle">
                    <div class="flex flex-col">
                      <span class="font-body-sm text-body-sm text-on-surface">${noKk}</span>
                      <span class="font-body-sm text-body-sm text-text-muted text-[11px]">${alamat}</span>
                    </div>
                  </td>
                  <td class="py-3.5 px-space-md align-middle text-on-surface-variant font-mono">${wa}</td>
                  <td class="py-3.5 px-space-md align-middle">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-disetujui-bg text-status-disetujui-text font-label-sm text-label-sm font-semibold">
                      <span class="w-1.5 h-1.5 rounded-full bg-status-disetujui-text"></span> Aktif
                    </span>
                  </td>
                  <td class="py-3.5 px-space-md align-middle text-right">
                    <button type="button" class="h-8 px-2.5 rounded-lg bg-bg-ivory hover:bg-surface-container text-on-surface font-label-sm text-label-sm">Detail & KK</button>
                  </td>
                `;
                tbody.prepend(tr);
              }
              APP_STATE.warga.unshift({ id: 'WRG-' + Date.now(), nik, nama, noKk, hubungan: hub, jk, usia, alamat, noWa: wa, statusAkun: 'Aktif' });
              saveState({ warga: APP_STATE.warga });
              showGlobalToast('Data Warga Ditambahkan', `${nama} berhasil ditambahkan ke Buku Induk Penduduk.`);
              return true;
            },
            'Simpan Data Warga'
          );
        });
      } else if (txt === 'Verifikasi' || txt.includes('Setujui Akun')) {
        btn.addEventListener('click', () => {
          const row = btn.closest('tr') || document.querySelector('tr.bg-status-menunggu-bg\\/20');
          if (row) {
            row.classList.remove('bg-status-menunggu-bg/20');
            const badgeCell = row.querySelectorAll('td')[4];
            if (badgeCell) {
              badgeCell.innerHTML = `
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-disetujui-bg text-status-disetujui-text font-label-sm text-label-sm font-semibold">
                  <span class="w-1.5 h-1.5 rounded-full bg-status-disetujui-text"></span> Aktif
                </span>
              `;
            }
          }
          showGlobalToast('Akun Warga Diverifikasi!', 'Status akun Budi Santoso kini AKTIF dan notifikasi WA telah dikirim.');
        });
      } else if (txt.includes('Tolak / Salah')) {
        btn.addEventListener('click', () => {
          if (confirm('Tolak permohonan verifikasi akun mandiri ini?')) {
            showGlobalToast('Verifikasi Akun Ditolak', 'Notifikasi perbaikan data KTP telah dikirim ke pendaftar.', 'warning');
          }
        });
      } else if (txt.includes('Buatkan Akun')) {
        btn.addEventListener('click', () => {
          const row = btn.closest('tr');
          openUniversalModal(
            'Aktivasi Akun Portal Mandiri Warga',
            `
            <div class="space-y-3">
              <p class="text-[13px] text-[#3f4945]">Buat akses login mandiri dan tautkan nomor WhatsApp untuk warga ini:</p>
              <div>
                <label class="block text-[12px] font-bold mb-1">Nomor WhatsApp Warga</label>
                <input id="activate-wa" type="text" value="0857-9911-2233" class="w-full h-10 px-3 rounded-lg border border-[#E7ECE8] bg-[#F7F8F5] font-mono text-[13px]" />
              </div>
              <div>
                <label class="block text-[12px] font-bold mb-1">Kata Sandi Sementara</label>
                <input type="text" value="warga123" class="w-full h-10 px-3 rounded-lg border border-[#E7ECE8] bg-[#F7F8F5] font-mono text-[13px]" />
              </div>
            </div>
            `,
            (modal) => {
              const wa = modal.querySelector('#activate-wa').value;
              if (row) {
                const tds = row.querySelectorAll('td');
                if (tds[3]) tds[3].textContent = wa;
                if (tds[4]) {
                  tds[4].innerHTML = `
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-status-disetujui-bg text-status-disetujui-text font-label-sm text-label-sm font-semibold">
                      <span class="w-1.5 h-1.5 rounded-full bg-status-disetujui-text"></span> Aktif
                    </span>
                  `;
                }
              }
              showGlobalToast('Akun Berhasil Dibuat!', `Kredensial login telah dikirimkan ke WhatsApp ${wa}.`);
              return true;
            },
            'Aktifkan Akun'
          );
        });
      }
    });
  }

  // --- 5.6 BUKU REGISTER (`layar_16_laporan_buku_register_admin`) ---
  function initBukuRegisterScreen() {
    if (SCREEN_ID !== 'layar_16_laporan_buku_register_admin') return;

    const searchInput = document.querySelector('input[placeholder*="Cari No. Registrasi"]');
    if (searchInput) {
      searchInput.addEventListener('input', () => filterVisibleTables(searchInput.value));
    }

    document.querySelectorAll('button').forEach(btn => {
      const txt = btn.textContent.replace(/\s+/g, ' ').trim();
      if (txt.includes('Ekspor Excel / CSV')) {
        btn.addEventListener('click', () => {
          const rows = (APP_STATE.bukuRegister || []).map(r => [
            r.urut, r.tanggal, r.nomorSurat, r.singkatan, r.jenisNama, r.seksi, r.pemohon, r.nik, r.perihal, r.penandatangan, r.legalitas
          ]);
          downloadCsv(
            'buku_register_surat_keluar_desa_susukan.csv',
            ['No_Urut', 'Tanggal_Terbit', 'Nomor_Registrasi_Surat', 'Kode', 'Jenis_Surat', 'Seksi', 'Pemohon', 'NIK', 'Perihal', 'Penandatangan', 'Status_TTE'],
            rows.length ? rows : [['#0142', '19 Apr 2025', '470 / 0142 / Kesra / IV / 2025', 'SKTM', 'Keterangan Tidak Mampu', 'Seksi Kesra', 'Budi Santoso', '320901******0012', 'Beasiswa KIP-Kuliah', "H. Ma'ruf, S.Sos.", 'BSrE Terverifikasi']]
          );
        });
      } else if (txt.includes('Cetak Register (PDF)')) {
        btn.addEventListener('click', () => {
          window.print();
        });
      } else if (txt.includes('Catat Surat Manual')) {
        btn.addEventListener('click', () => {
          openUniversalModal(
            'Catat Agenda Surat Keluar Manual (Buku Register)',
            `
            <div class="space-y-3">
              <div>
                <label class="block text-[12px] font-bold mb-1">Nomor Surat Resmi *</label>
                <input id="reg-man-no" type="text" value="474 / 0143 / Pemdes / IV / 2025" class="w-full h-10 px-3 rounded-lg border border-[#E7ECE8] bg-[#F7F8F5] font-mono text-[13px]" />
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[12px] font-bold mb-1">Jenis Surat</label>
                  <input id="reg-man-jenis" type="text" value="Surat Keterangan Domisili" class="w-full h-10 px-3 rounded-lg border border-[#E7ECE8] bg-[#F7F8F5] text-[13px]" />
                </div>
                <div>
                  <label class="block text-[12px] font-bold mb-1">Warga Pemohon</label>
                  <input id="reg-man-nama" type="text" placeholder="Nama lengkap pemohon" value="H. Ahmad Dahlan" class="w-full h-10 px-3 rounded-lg border border-[#E7ECE8] bg-[#F7F8F5] text-[13px]" />
                </div>
              </div>
              <div>
                <label class="block text-[12px] font-bold mb-1">Perihal / Keperluan Surat</label>
                <textarea id="reg-man-perihal" rows="2" class="w-full p-3 rounded-lg border border-[#E7ECE8] bg-[#F7F8F5] text-[13px]">Kelengkapan administrasi perbankan Bank BJB KCP Susukan.</textarea>
              </div>
            </div>
            `,
            (modal) => {
              const no = modal.querySelector('#reg-man-no').value;
              const jenis = modal.querySelector('#reg-man-jenis').value;
              const nama = modal.querySelector('#reg-man-nama').value;
              const perihal = modal.querySelector('#reg-man-perihal').value;
              const tbody = document.querySelector('table tbody');
              if (tbody) {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-mint-tag transition-colors group';
                tr.innerHTML = `
                  <td class="py-3.5 px-space-md whitespace-nowrap">
                    <div class="flex flex-col">
                      <span class="font-headline-sm text-headline-sm text-primary">#0143</span>
                      <span class="font-label-sm text-label-sm text-text-muted">Hari ini • Baru saja</span>
                    </div>
                  </td>
                  <td class="py-3.5 px-space-md whitespace-nowrap">
                    <span class="font-mono bg-bg-ivory px-2 py-0.5 rounded font-semibold">${no}</span>
                  </td>
                  <td class="py-3.5 px-space-md whitespace-nowrap">
                    <div class="flex flex-col">
                      <span class="font-label-md text-label-md text-on-surface">${jenis}</span>
                      <span class="inline-block mt-0.5 text-[10px] font-label-eyebrow uppercase text-primary font-bold">Seksi Pemdes</span>
                    </div>
                  </td>
                  <td class="py-3.5 px-space-md whitespace-nowrap font-semibold">${nama}</td>
                  <td class="py-3.5 px-space-md">${perihal}</td>
                  <td class="py-3.5 px-space-md whitespace-nowrap">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-selesai-bg text-status-selesai-text font-label-sm text-label-sm">
                      <span class="material-symbols-outlined text-xs">verified</span> Terdaftar
                    </span>
                  </td>
                  <td class="py-3.5 px-space-md text-right whitespace-nowrap">
                    <button type="button" onclick="openOfficialLetterPrint({jenisNama:'${jenis}',nomorResmi:'${no}',nama:'${nama}',keperluan:'${perihal}'})" class="p-1.5 text-primary hover:bg-bg-ivory rounded-lg">
                      <span class="material-symbols-outlined text-lg">visibility</span>
                    </button>
                  </td>
                `;
                tbody.prepend(tr);
              }
              showGlobalToast('Agenda Surat Dicatat', `Nomor ${no} berhasil masuk ke Buku Register Surat Keluar.`);
              return true;
            },
            'Simpan ke Buku Register'
          );
        });
      }
    });
  }

  // --- 5.7 KEPALA DESA TTE (`layar_20_persetujuan_kepala_desa_kades`) ---
  function initKadesScreen() {
    if (SCREEN_ID !== 'layar_20_persetujuan_kepala_desa_kades') return;

    const origSign = window.executeSigning;
    window.executeSigning = async function () {
      if (typeof origSign === 'function') origSign();
      await fetch('/api/pengajuan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateStatus',
          id: 'SKT-0411',
          status: 'Selesai',
          catatan: 'Telah disetujui dan ditandatangani secara elektronik (TTE BSrE) oleh Kuwu Desa Susukan.',
          aktor: "H. Ma'ruf, S.Sos. (Kuwu)"
        })
      });
      showGlobalToast('TTE BSrE Berhasil Dibubuhkan!', 'Nomor surat 470/0142/Kesra/IV/2025 dan QR Code resmi telah diterbitkan.');
    };
  }

  // =========================================================================
  // 6. UNIVERSAL SMART DELEGATED EVENT HANDLER FOR ALL 49 SCREENS
  // =========================================================================
  function setupUniversalSmartHandlers() {
    document.body.addEventListener('click', (e) => {
      const btn = e.target.closest('button, a');
      if (!btn) return;

      // Ignore our own modal / dock controls
      if (btn.closest('#susukan-floating-dock') || btn.closest('#susukan-universal-modal-backdrop')) return;

      const text = btn.textContent.replace(/\s+/g, ' ').trim();
      const lower = text.toLowerCase();
      const titleAttr = (btn.getAttribute('title') || '').toLowerCase();

      // 1. Navigation shortcuts for common CTA buttons
      if (lower.includes('ajukan surat baru') || lower.includes('buat pengajuan baru')) {
        e.preventDefault();
        window.location.href = SCREEN_ID.includes('mobile')
          ? '/screen/layar_5_mobile_formulir_pengajuan_surat'
          : '/screen/layar_5_formulir_pengajuan_surat';
        return;
      }
      if (lower.includes('kembali ke beranda')) {
        e.preventDefault();
        window.location.href = SCREEN_ID.includes('mobile')
          ? '/screen/layar_4_mobile_dashboard_pelacakan_warga'
          : '/screen/layar_4_dashboard_warga_pelacakan_surat';
        return;
      }
      if (lower.includes('tanya operator desa') || lower.includes('bantuan sop')) {
        e.preventDefault();
        window.location.href = '/screen/layar_pusat_bantuan_digital_chatbot_interaktif_pelayanan_warga';
        return;
      }
      if (lower.includes('buku register keluar')) {
        e.preventDefault();
        window.location.href = '/screen/layar_16_laporan_buku_register_admin';
        return;
      }
      if (lower.includes('lihat tiket') || lower.includes('tiket antrean')) {
        e.preventDefault();
        window.location.href = '/screen/layar_detail_tiket_antrean_loket_pelayanan_kecamatan_susukan';
        return;
      }
      if (lower.includes('cek validasi qr') || lower.includes('pindai qr')) {
        e.preventDefault();
        window.location.href = '/screen/layar_verifikasi_publik_pemindaian_qr_code_tte_surat';
        return;
      }
      if (lower.includes('ajukan surat pengantar cetak ulang ktp')) {
        e.preventDefault();
        window.location.href = '/screen/layar_mobile_formulir_cetak_ulang_e_ktp_rusak';
        return;
      }
      if (lower.includes('buka di aplikasi portal warga') || lower.includes('lihat status pengajuan di aplikasi')) {
        e.preventDefault();
        window.location.href = '/screen/layar_6_mobile_riwayat_unduh_surat_warga';
        return;
      }

      // 2. Audio Bell / Queue Call Buttons (Loket & Display TV)
      if (
        lower.includes('tes bel') ||
        lower.includes('tes nada bel') ||
        lower.includes('tes chime') ||
        lower.includes('uji panggilan') ||
        lower.includes('panggil ulang') ||
        lower.includes('panggil antrean') ||
        lower.includes('panggil sekarang') ||
        lower.includes('bunyikan chime')
      ) {
        playBellChime('Nomor Antrean A kosong empat puluh, silakan menuju ke Loket Dua Pelayanan Kecamatan Susukan.');
        showGlobalToast('Pemanggilan Suara Loket Aktif', 'Nada Ding-Dong & Pengumuman Suara Loket 2 berhasil diputar.');
        return;
      }

      // 3. Official PDF Download / Print Preview Buttons
      if (
        lower.includes('unduh pdf') ||
        lower.includes('unduh salinan pdf') ||
        lower.includes('unduh lembar') ||
        lower.includes('cetak uji (pdf)') ||
        lower.includes('lihat surat') ||
        titleAttr.includes('pratinjau salinan surat') ||
        titleAttr.includes('unduh file pdf')
      ) {
        if (!btn.hasAttribute('onclick')) {
          e.preventDefault();
          const row = btn.closest('tr');
          let item = null;
          if (row) {
            const idMatch = row.textContent.match(/[A-Z]{2,4}-\d{3,4}/);
            if (idMatch) item = (APP_STATE.pengajuan || []).find(p => p.id === idMatch[0]);
          }
          openOfficialLetterPrint(item);
          return;
        }
      }

      // 4. Backup JSON without password (Design.md Section 7)
      if (lower.includes('unduh backup json') || lower.includes('unduh berkas cadangan (.json)')) {
        e.preventDefault();
        window.location.href = '/api/backup';
        showGlobalToast('Backup JSON Diunduh', 'Cadangan basis data Desa Susukan (tanpa hash password) berhasil diunduh.');
        return;
      }

      // 5. Copy to Clipboard buttons (Nomor Surat, Hash SHA-256, Variables `{nama_lengkap}`)
      if (lower.includes('content_copy') || titleAttr.includes('salin') || lower.includes('salin ')) {
        const varMatch = text.match(/\{[a-z0-9_]+\}/i);
        const toCopy = varMatch ? varMatch[0] : (btn.closest('td, div')?.innerText.replace('content_copy', '').trim() || '470 / 0142 / Kesra / IV / 2025');
        navigator.clipboard?.writeText(toCopy).catch(() => {});
        showGlobalToast('Disalin ke Papan Klip', `"${toCopy.slice(0, 48)}" berhasil disalin.`);
        return;
      }

      // 6. Perbaiki Berkas (Re-upload revision modal)
      if (lower.includes('perbaiki berkas') || lower.includes('unggah ulang berkas')) {
        if (!btn.hasAttribute('onclick')) {
          e.preventDefault();
          openUniversalModal(
            'Unggah Ulang Berkas Perbaikan (Revisi)',
            `
            <div class="space-y-3">
              <div class="p-3 rounded-xl bg-[#FDEBD3] text-[#B45309] text-[12.5px]">
                <strong>Catatan Petugas:</strong> Foto e-KTP sebelumnya agak buram pada bagian 16 digit NIK. Mohon unggah foto yang terang dan tegak lurus.
              </div>
              <div>
                <label class="block text-[12px] font-bold mb-1">Pilih Berkas Perbaikan (JPG / PNG / PDF, Maks. 2MB)</label>
                <input id="reupload-file" type="file" accept=".jpg,.jpeg,.png,.pdf" class="w-full p-2 rounded-lg border border-[#E7ECE8] bg-[#F7F8F5] text-[13px]" />
              </div>
              <div>
                <label class="block text-[12px] font-bold mb-1">Keterangan Tambahan Warga</label>
                <input type="text" value="Sudah difoto ulang dengan jelas sesuai arahan petugas." class="w-full h-10 px-3 rounded-lg border border-[#E7ECE8] bg-[#F7F8F5] text-[13px]" />
              </div>
            </div>
            `,
            async () => {
              await fetch('/api/pengajuan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'updateStatus',
                  id: 'SKU-0398',
                  status: 'Menunggu',
                  catatan: 'Warga telah mengunggah ulang berkas perbaikan e-KTP.',
                  aktor: 'Siti Aminah (Warga)'
                })
              });
              const row = btn.closest('tr');
              if (row) {
                const tds = row.querySelectorAll('td');
                if (tds[4]) {
                  tds[4].innerHTML = `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-status-menunggu-bg text-status-menunggu-text"><span class="w-1.5 h-1.5 rounded-full bg-status-menunggu-text"></span>Menunggu</span>`;
                }
              }
              showGlobalToast('Berkas Perbaikan Terkirim!', 'Status permohonan kembali menjadi MENUNGGU verifikasi petugas.');
              return true;
            },
            'Kirim Berkas Revisi'
          );
          return;
        }
      }

      // 7. Lihat Detail / Berkas / Detail & KK / Audit Log buttons without onclick
      if (
        !btn.hasAttribute('onclick') &&
        (lower === 'lihat detail' || lower === 'berkas' || lower === 'detail & kk' || lower === 'detail' || titleAttr.includes('detail audit log'))
      ) {
        e.preventDefault();
        const row = btn.closest('tr');
        const summary = row ? row.innerText.replace(/\s+/g, ' ').trim() : 'Berkas Pelayanan Administrasi Desa Susukan';
        openUniversalModal(
          'Rincian Data & Riwayat Verifikasi Berkas',
          `
          <div class="space-y-3">
            <div class="p-3.5 rounded-xl bg-[#F7F8F5] border border-[#E7ECE8] text-[13px]">
              <div class="font-bold text-[#005144] mb-1">Ringkasan Baris Terpilih:</div>
              <div>${summary}</div>
            </div>
            <div class="grid grid-cols-5 gap-1.5 text-center text-[11px] pt-1">
              <div class="p-2 rounded-lg bg-[#E1F3EC] text-[#0F5B49] font-bold">1. Menunggu ✓</div>
              <div class="p-2 rounded-lg bg-[#005144] text-white font-bold">2. Diverifikasi</div>
              <div class="p-2 rounded-lg bg-[#F7F8F5] text-[#74817D]">3. RT/RW</div>
              <div class="p-2 rounded-lg bg-[#F7F8F5] text-[#74817D]">4. Disetujui</div>
              <div class="p-2 rounded-lg bg-[#F7F8F5] text-[#74817D]">5. Selesai</div>
            </div>
            <div class="text-[12px] text-[#74817D]">
              Diverifikasi oleh: <strong>Bpk. Agus Setiawan (Kasi Pelayanan Desa Susukan)</strong> • Integritas SHA-256 Tervalidasi.
            </div>
          </div>
          `,
          () => {
            openOfficialLetterPrint();
            return true;
          },
          'Buka Lembar Surat (PDF)'
        );
        return;
      }

      // 8. Generic Filter / Tab Pill Switching & Table Filtering
      if (
        !btn.hasAttribute('onclick') &&
        btn.tagName === 'BUTTON' &&
        (lower.startsWith('semua') ||
         lower.startsWith('menunggu') ||
         lower.startsWith('diverifikasi') ||
         lower.startsWith('perlu perbaikan') ||
         lower.startsWith('disetujui') ||
         lower.startsWith('selesai') ||
         lower.startsWith('ditolak') ||
         lower.startsWith('akun aktif') ||
         lower.startsWith('data saja') ||
         lower.startsWith('terkirim') ||
         lower.startsWith('gagal'))
      ) {
        const parent = btn.parentElement;
        if (parent) {
          parent.querySelectorAll('button').forEach(b => {
            b.classList.remove('bg-primary', 'bg-primary-container', 'text-on-primary', 'bg-surface-card', 'shadow-sm');
          });
          btn.classList.add('bg-primary-container', 'text-on-primary', 'shadow-sm');
        }
        let filterKey = '';
        if (lower.startsWith('menunggu')) filterKey = 'menunggu';
        else if (lower.startsWith('diverifikasi')) filterKey = 'diverifikasi';
        else if (lower.startsWith('perlu perbaikan')) filterKey = 'perlu perbaikan';
        else if (lower.startsWith('disetujui') || lower.startsWith('selesai')) filterKey = 'selesai';
        else if (lower.startsWith('ditolak')) filterKey = 'ditolak';
        else if (lower.startsWith('akun aktif')) filterKey = 'aktif';
        else if (lower.startsWith('data saja')) filterKey = 'data saja';
        else if (lower.startsWith('terkirim')) filterKey = 'terkirim';
        else if (lower.startsWith('gagal')) filterKey = 'gagal';
        filterVisibleTables(filterKey);
        return;
      }

      // 9. WhatsApp quick replies & chat actions on WA screens
      if (SCREEN_ID.includes('whatsapp') && btn.tagName === 'BUTTON' && !btn.hasAttribute('onclick')) {
        if (lower.includes('arrow_back')) {
          window.location.href = '/screen/layar_4_mobile_dashboard_pelacakan_warga';
          return;
        }
        if (text.length > 3 && !['videocam', 'call', 'more_vert', 'mood', 'attach_file', 'photo_camera', 'mic', 'sentiment_satisfied'].includes(lower)) {
          appendWaSimulatedBubble(text);
          return;
        }
      }

      // 10. Catch-all feedback for any other button that didn't have its own onclick handler
      if (btn.tagName === 'BUTTON' && !btn.hasAttribute('onclick') && !btn.id && text.length > 1) {
        showGlobalToast('Aksi Diproses', `Fitur "${text.slice(0, 42)}" berhasil dijalankan.`);
      }
    });
  }

  function appendWaSimulatedBubble(userText) {
    const chatContainer = document.querySelector('main, .overflow-y-auto') || document.body;
    const bubble = document.createElement('div');
    bubble.className = 'p-3 my-2 ml-auto max-w-xs rounded-2xl bg-[#d9fdd3] text-[#111b21] text-[13px] shadow-sm';
    bubble.innerHTML = `<div class="font-medium">${userText}</div><div class="text-[10px] text-right text-gray-500 mt-1">Baru saja ✓✓</div>`;
    chatContainer.appendChild(bubble);

    setTimeout(() => {
      const reply = document.createElement('div');
      reply.className = 'p-3 my-2 mr-auto max-w-xs rounded-2xl bg-white text-[#111b21] text-[13px] shadow-sm border border-gray-200';
      reply.innerHTML = `
        <div class="text-[11px] font-bold text-[#005144] mb-0.5">Bot Layanan Mandiri Desa Susukan</div>
        <div>Terima kasih! Pesan Anda (<em>"${userText}"</em>) telah tercatat di sistem pelayanan Desa Susukan. Petugas loket segera menindaklanjuti.</div>
        <div class="text-[10px] text-right text-gray-500 mt-1">Baru saja</div>
      `;
      chatContainer.appendChild(reply);
      reply.scrollIntoView({ behavior: 'smooth' });
    }, 650);
  }

  // =========================================================================
  // 7. FLOATING NAVIGATOR DOCK (49 LAYAR + SWITCH ROLE + DARK MODE + CTRL+K)
  // =========================================================================
  function mountFloatingNavigatorDock() {
    if (document.getElementById('susukan-floating-dock')) return;

    const dock = document.createElement('div');
    dock.id = 'susukan-floating-dock';
    dock.className = 'fixed bottom-4 right-4 z-[9980] flex items-center gap-1.5 p-1.5 rounded-full shadow-2xl no-print';
    dock.style.background = '#0F3D3E';
    dock.style.border = '1px solid rgba(232, 185, 91, 0.4)';
    dock.style.color = '#FFFFFF';

    dock.innerHTML = `
      <button type="button" id="susukan-open-navigator" style="background:#E8B95B;color:#0F3D3E;" class="px-3.5 py-1.5 rounded-full font-bold text-[12px] flex items-center gap-1.5 cursor-pointer hover:brightness-95 transition-all">
        <span class="material-symbols-outlined text-[17px]">apps</span>
        <span>Semua Fitur & 49 Layar (Ctrl+K)</span>
      </button>
      <a href="/screen/layar_4_dashboard_warga_pelacakan_surat" title="Dashboard Warga" class="px-2.5 py-1.5 rounded-full text-[11px] font-semibold hover:bg-white/15 text-white transition-colors hidden sm:inline-block">
        Warga
      </a>
      <a href="/screen/layar_12_verifikasi_pengajuan_petugas_admin" title="Dashboard Admin Desa" class="px-2.5 py-1.5 rounded-full text-[11px] font-semibold hover:bg-white/15 text-white transition-colors hidden sm:inline-block">
        Admin
      </a>
      <a href="/screen/layar_20_persetujuan_kepala_desa_kades" title="Dashboard Kepala Desa (TTE)" class="px-2.5 py-1.5 rounded-full text-[11px] font-semibold hover:bg-white/15 text-white transition-colors hidden sm:inline-block">
        Kades
      </a>
      <a href="/screen/layar_operator_loket_panel_kendali_pemanggilan_antrean_cetak_e_ktp" title="Panel Loket Kecamatan" class="px-2.5 py-1.5 rounded-full text-[11px] font-semibold hover:bg-white/15 text-white transition-colors hidden md:inline-block">
        Loket
      </a>
      <button type="button" id="susukan-toggle-dark" title="Mode Gelap / Terang" class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/15 text-[#E8B95B] cursor-pointer">
        <span class="material-symbols-outlined text-[18px]">dark_mode</span>
      </button>
    `;

    document.body.appendChild(dock);

    dock.querySelector('#susukan-open-navigator').addEventListener('click', openScreenNavigatorModal);
    dock.querySelector('#susukan-toggle-dark').addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('susukan_dark_mode', isDark ? '1' : '0');
      showGlobalToast(isDark ? 'Mode Gelap Aktif' : 'Mode Terang Aktif', 'Tampilan warna disesuaikan dengan Design Tokens.');
    });

    // Global Ctrl+K shortcut
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openScreenNavigatorModal();
      }
    });
  }

  function openScreenNavigatorModal() {
    const screens = APP_STATE.screens || [];
    const grouped = {};
    screens.forEach(s => {
      if (!grouped[s.category]) grouped[s.category] = [];
      grouped[s.category].push(s);
    });

    const modal = openUniversalModal(
      `Pusat Kendali & Peta Navigasi Lengkap (${screens.length} Layar Tersedia)`,
      `
      <div class="space-y-4">
        <div class="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between bg-[#E8F1ED] p-3 rounded-xl">
          <div class="relative flex-1">
            <input id="susukan-screen-search" type="text" placeholder="Ketik nama layar, fitur, loket, WA, GIS, SKTM..." class="w-full h-10 pl-3 pr-3 rounded-lg bg-white border border-[#E7ECE8] text-[13px] focus:outline-none" />
          </div>
          <div class="flex items-center gap-1.5">
            <a href="/screen/layar_1_masuk_autentikasi_warga" class="px-3 py-2 rounded-lg bg-[#005144] text-white text-[12px] font-semibold whitespace-nowrap">Login Utama</a>
            <button type="button" id="susukan-reset-demo" class="px-3 py-2 rounded-lg bg-[#FBE4E4] text-[#B02A2A] text-[12px] font-semibold whitespace-nowrap cursor-pointer">Reset Data Demo</button>
          </div>
        </div>
        <div id="susukan-screen-list" class="space-y-4 max-h-[58vh] overflow-y-auto pr-1">
          ${Object.entries(grouped).map(([cat, list]) => `
            <div class="susukan-cat-group">
              <div class="text-[11px] font-bold uppercase tracking-wider text-[#005144] mb-2 pb-1 border-b border-[#E7ECE8]">${cat} (${list.length})</div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                ${list.map(item => {
                  const isCurrent = item.id === SCREEN_ID;
                  return `
                    <a href="${item.url}" data-search="${(item.title + ' ' + item.id + ' ' + item.category).toLowerCase()}" class="susukan-screen-card p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                      isCurrent
                        ? 'bg-[#005144] text-white border-[#005144] font-bold shadow-sm'
                        : 'bg-[#F7F8F5] hover:bg-[#E8F1ED] text-[#1E302D] border-[#E7ECE8]'
                    }">
                      <div class="truncate">
                        <div class="text-[12.5px] truncate">${item.title}</div>
                        <div class="text-[10px] opacity-70 font-mono truncate">${item.id}</div>
                      </div>
                      <span class="material-symbols-outlined text-[16px] shrink-0">${isCurrent ? 'check_circle' : 'arrow_forward'}</span>
                    </a>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      `,
      null,
      'Tutup',
      '780px'
    );

    const searchInput = modal.querySelector('#susukan-screen-search');
    if (searchInput) {
      searchInput.focus();
      searchInput.addEventListener('input', () => {
        const q = searchInput.value.trim().toLowerCase();
        modal.querySelectorAll('.susukan-screen-card').forEach(card => {
          const match = !q || card.getAttribute('data-search').includes(q);
          card.style.display = match ? '' : 'none';
        });
      });
    }

    const resetBtn = modal.querySelector('#susukan-reset-demo');
    if (resetBtn) {
      resetBtn.addEventListener('click', async () => {
        if (!confirm('Reset seluruh data pengajuan, warga, dan log ke kondisi awal demo?')) return;
        await fetch('/api/reset-demo', { method: 'POST' });
        localStorage.removeItem('susukan_state_cache');
        showGlobalToast('Data Demo Direset', 'Memuat ulang halaman...');
        setTimeout(() => location.reload(), 600);
      });
    }
  }

  // =========================================================================
  // 8. BOOTSTRAP ON DOM READY
  // =========================================================================
  async function init() {
    await loadState();
    setupRoleSidebarAndTopbar();
    initLoginScreen();
    initWargaDashboard();
    initFormulirPengajuan();
    initAdminVerification();
    initDataWargaScreen();
    initBukuRegisterScreen();
    initKadesScreen();
    setupUniversalSmartHandlers();
    mountFloatingNavigatorDock();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

