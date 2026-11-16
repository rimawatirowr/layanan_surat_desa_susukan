const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const BASE_DIR = path.join(__dirname, 'stitch_layanan_surat_online_desa_susukan');
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getInitialDb() {
  return {
    desaConfig: {
      namaDesa: 'Desa Susukan',
      kecamatan: 'Kecamatan Susukan',
      kabupaten: 'Kabupaten Cirebon',
      provinsi: 'Jawa Barat',
      kodePos: '45166',
      alamat: 'Jalan Raya Susukan No. 01 Kode Pos 45166',
      email: 'pemdes@susukan.desa.id',
      telepon: '0812-3456-7890',
      namaKuwu: "H. MA'RUF, S.Sos.",
      nipKuwu: '19740512 199903 1 004',
      namaSekdes: 'Drs. H. Suhendar, M.Si.',
      nipSekdes: '19780814 200501 1 009',
      formatNomor: '{kode} / {urut} / {seksi} / {romawi} / {tahun}',
      nomorUrutBerikutnya: 145
    },
    users: [
      {
        id: 'USR-001',
        identifier: '3209010101010001',
        nik: '3209010101010001',
        nama: 'Siti Aminah',
        role: 'warga',
        password: 'warga123',
        noHp: '6281234568891',
        alamat: 'RT 02 / RW 01, Dusun II, Desa Susukan',
        statusVerifikasi: 'Aktif',
        setujuPrivasi: true
      },
      {
        id: 'USR-002',
        identifier: 'admin',
        nik: '3209011503850002',
        nama: 'Bpk. Agus Setiawan',
        jabatan: 'Kasi Pelayanan Desa',
        role: 'admin',
        password: 'admin123',
        noHp: '6281234567890',
        alamat: 'Kantor Kuwu Desa Susukan',
        statusVerifikasi: 'Aktif',
        setujuPrivasi: true
      },
      {
        id: 'USR-003',
        identifier: 'kades',
        nik: '3209011205740001',
        nama: "H. Ma'ruf, S.Sos.",
        jabatan: 'Kuwu / Kepala Desa Susukan',
        role: 'kades',
        password: 'kades123',
        noHp: '6281122334455',
        alamat: 'Kantor Kuwu Desa Susukan',
        statusVerifikasi: 'Aktif',
        setujuPrivasi: true
      }
    ],
    warga: [
      {
        id: 'WRG-001',
        nik: '3209010101010004',
        nama: 'Siti Aminah',
        noKk: '3209012304000004',
        hubungan: 'Kepala KK',
        jk: 'Perempuan',
        usia: 28,
        ttl: 'Cirebon, 14 Mei 1997',
        pekerjaan: 'Wiraswasta',
        alamat: 'RT 02 / RW 01 Dusun II',
        dusun: 'dusun2',
        noWa: '6281234568891',
        statusAkun: 'Aktif'
      },
      {
        id: 'WRG-002',
        nik: '3209012408010012',
        nama: 'Budi Santoso',
        noKk: '3209012304000012',
        hubungan: 'Kepala KK',
        jk: 'Laki-laki',
        usia: 34,
        ttl: 'Cirebon, 24 Agustus 1991',
        pekerjaan: 'Mahasiswa / Buruh Harian',
        alamat: 'RT 01 / RW 03 Dusun I',
        dusun: 'dusun1',
        noWa: '6285712344211',
        statusAkun: 'Menunggu Verifikasi'
      },
      {
        id: 'WRG-003',
        nik: '3209011002730089',
        nama: 'H. Ahmad Dahlan',
        noKk: '3209012304000089',
        hubungan: 'Kepala KK',
        jk: 'Laki-laki',
        usia: 52,
        ttl: 'Cirebon, 10 Februari 1973',
        pekerjaan: 'Petani / Pekebun',
        alamat: 'RT 04 / RW 02 Dusun III',
        dusun: 'dusun3',
        noWa: '6282188999012',
        statusAkun: 'Aktif'
      },
      {
        id: 'WRG-004',
        nik: '3209011809060294',
        nama: 'Dewi Kurniasih',
        noKk: '3209012304000004',
        hubungan: 'Anggota',
        jk: 'Perempuan',
        usia: 19,
        ttl: 'Cirebon, 18 September 2006',
        pekerjaan: 'Pelajar / Mahasiswa',
        alamat: 'RT 02 / RW 01 Dusun II',
        dusun: 'dusun2',
        noWa: '-',
        statusAkun: 'Data Saja'
      },
      {
        id: 'WRG-005',
        nik: '3209010511840091',
        nama: 'Rudi Hermawan',
        noKk: '3209012304000091',
        hubungan: 'Kepala KK',
        jk: 'Laki-laki',
        usia: 41,
        ttl: 'Cirebon, 05 November 1984',
        pekerjaan: 'Karyawan Swasta',
        alamat: 'RT 03 / RW 01 Dusun I',
        dusun: 'dusun1',
        noWa: '6281377882109',
        statusAkun: 'Aktif'
      }
    ],
    jenisSurat: [
      {
        id: 'domisili',
        kode: '474',
        singkatan: 'SKD',
        nama: 'Surat Keterangan Domisili (SKD)',
        kategori: 'Kependudukan',
        seksi: 'Pemdes',
        sla: '1 Hari Kerja',
        penandatangan: 'Kuwu / Kepala Desa',
        syarat: ['Fotokopi / Scan e-KTP Pemohon', 'Kartu Keluarga (KK) Desa Susukan', 'Surat Pengantar RT / RW Setempat'],
        aktif: true
      },
      {
        id: 'sktm',
        kode: '470',
        singkatan: 'SKTM',
        nama: 'Surat Keterangan Tidak Mampu (SKTM)',
        kategori: 'Kesejahteraan',
        seksi: 'Kesra',
        sla: '1 Hari Kerja',
        penandatangan: 'Kuwu / Kepala Desa',
        syarat: ['Fotokopi / Scan e-KTP Pemohon', 'Kartu Keluarga (KK) Desa Susukan', 'Foto Rumah (Tampak Depan) & Surat Pernyataan'],
        aktif: true
      },
      {
        id: 'skck',
        kode: '300',
        singkatan: 'SKCK',
        nama: 'Surat Pengantar SKCK',
        kategori: 'Hukum & Umum',
        seksi: 'Trantib',
        sla: 'Sama Hari',
        penandatangan: 'Kuwu / Sekdes',
        syarat: ['Fotokopi / Scan e-KTP Pemohon', 'Kartu Keluarga (KK) Desa Susukan', 'Pas Foto Formal 4x6 (Latar Merah) & Pengantar RT'],
        aktif: true
      },
      {
        id: 'sku',
        kode: '510',
        singkatan: 'SKU',
        nama: 'Surat Keterangan Usaha (SKU)',
        kategori: 'Usaha & Ekonomi',
        seksi: 'Ekbang',
        sla: '1 Hari Kerja',
        penandatangan: 'Kuwu / Kepala Desa',
        syarat: ['Fotokopi / Scan e-KTP Pemohon', 'Kartu Keluarga (KK) Desa Susukan', 'Foto Tempat Usaha & Surat Keterangan RT/RW'],
        aktif: true
      },
      {
        id: 'ktp',
        kode: '471',
        singkatan: 'SP-KTP',
        nama: 'Surat Pengantar Cetak Ulang e-KTP',
        kategori: 'Kependudukan',
        seksi: 'Pemdes',
        sla: 'Sama Hari',
        penandatangan: 'Kuwu / Kepala Desa',
        syarat: ['Foto Fisik e-KTP Rusak / Surat Kehilangan', 'Kartu Keluarga (KK) Terbaru'],
        aktif: true
      }
    ],
    pengajuan: [
      {
        id: 'SKT-0411',
        jenisId: 'sktm',
        jenisNama: 'Surat Keterangan Tidak Mampu (SKTM)',
        singkatan: 'SKTM',
        nik: '3209012408010012',
        nama: 'Budi Santoso',
        ttl: 'Cirebon, 24 Agustus 2001',
        pekerjaan: 'Mahasiswa / Belum Bekerja',
        noWa: '0812-3498-7712',
        alamat: 'RT 02 / RW 01, Dusun II, Desa Susukan',
        tanggal: '19 Apr 2025',
        waktu: '09:20 WIB',
        keperluan: 'Pengajuan Beasiswa Kuliah Kartu Indonesia Pintar (KIP-K) Semester Gasal 2025/2026 di Universitas Swadaya Gunung Jati.',
        status: 'Menunggu',
        catatan: 'Berkas KTP sudah sesuai. Pastikan tanda tangan RT/RW pada surat pengantar terbaca jelas.',
        berkas: ['KTP_Budi.pdf', 'Pengantar_RT02.jpg'],
        nomorResmi: '470 / 0411 / Kesra / IV / 2025',
        qrToken: 'BSrE-SSK-2025-0411-9F2'
      },
      {
        id: 'SKU-0398',
        jenisId: 'sku',
        jenisNama: 'Surat Keterangan Usaha (SKU)',
        singkatan: 'SKU',
        nik: '3209010101010004',
        nama: 'Siti Aminah',
        ttl: 'Cirebon, 14 Mei 1997',
        pekerjaan: 'Wiraswasta / Pedagang',
        noWa: '0812-3456-8891',
        alamat: 'RT 02 / RW 01, Dusun II, Desa Susukan',
        tanggal: '18 Apr 2025',
        waktu: '14:10 WIB',
        keperluan: 'Pengajuan KUR Mikro BRI untuk Toko Sembako berkah Susukan',
        status: 'Perlu Perbaikan',
        catatan: 'Foto KTP agak buram di bagian NIK. Mohon unggah ulang foto e-KTP dengan pencahayaan terang.',
        berkas: ['KTP_SitiAminah.jpg', 'Foto_Warung.jpg'],
        nomorResmi: '-',
        qrToken: '-'
      },
      {
        id: 'SKU-0294',
        jenisId: 'sku',
        jenisNama: 'Surat Keterangan Usaha (SKU)',
        singkatan: 'Ket. Usaha',
        nik: '3209011809060294',
        nama: 'Dewi Kurniasih',
        ttl: 'Cirebon, 18 September 2006',
        pekerjaan: 'Wiraswasta Kuliner',
        noWa: '0857-9911-2233',
        alamat: 'RT 02 / RW 01, Dusun II, Desa Susukan',
        tanggal: '19 Apr 2025',
        waktu: '08:45 WIB',
        keperluan: 'Persyaratan Kredit Usaha Rakyat (KUR) Bank BJB KCP Susukan',
        status: 'Menunggu',
        catatan: 'Menunggu pemeriksaan kelengkapan foto tempat usaha oleh Kasi Ekbang.',
        berkas: ['KTP_Dewi.jpg', 'SKU_PengantarRT.pdf'],
        nomorResmi: '510 / 0294 / Ekbang / IV / 2025',
        qrToken: 'BSrE-SSK-2025-0294-3A1'
      },
      {
        id: 'SKD-0182',
        jenisId: 'domisili',
        jenisNama: 'Surat Keterangan Domisili (SKD)',
        singkatan: 'Ket. Domisili',
        nik: '3209011002730089',
        nama: 'Ahmad Suhendra',
        ttl: 'Cirebon, 10 Februari 1973',
        pekerjaan: 'Petani',
        noWa: '0821-8899-9012',
        alamat: 'RT 04 / RW 02, Dusun III, Desa Susukan',
        tanggal: '18 Apr 2025',
        waktu: '16:10 WIB',
        keperluan: 'Persyaratan Pembukaan Rekening Bank BRI Unit Susukan & Perpanjangan KTP',
        status: 'Disetujui',
        catatan: 'Telah diverifikasi oleh Bpk. Agus Setiawan (Kasi Pelayanan). Menunggu TTE Kuwu.',
        berkas: ['KTP_Ahmad.pdf', 'KK_Ahmad.pdf'],
        nomorResmi: '474 / 0182 / Pemdes / IV / 2025',
        qrToken: 'BSrE-SSK-2025-0182-7C4'
      },
      {
        id: 'SKK-0091',
        jenisId: 'domisili',
        jenisNama: 'Surat Keterangan Kematian',
        singkatan: 'Ket. Kematian',
        nik: '3209010511840091',
        nama: 'Rudi Hermawan',
        ttl: 'Cirebon, 05 November 1984',
        pekerjaan: 'Karyawan Swasta',
        noWa: '0813-7788-2109',
        alamat: 'RT 03 / RW 01, Dusun I, Desa Susukan',
        tanggal: '18 Apr 2025',
        waktu: '11:00 WIB',
        keperluan: 'Pengurusan Akta Kematian Disdukcapil Kabupaten Cirebon',
        status: 'Perlu Perbaikan',
        catatan: 'Surat keterangan visum rumah sakit / puskesmas belum terlampir.',
        berkas: ['KTP_Pelapor.jpg'],
        nomorResmi: '-',
        qrToken: '-'
      },
      {
        id: 'SKTM-0344',
        jenisId: 'sktm',
        jenisNama: 'Surat Keterangan Tidak Mampu (SKTM)',
        singkatan: 'SKTM',
        nik: '3209010101010004',
        nama: 'Siti Aminah',
        ttl: 'Cirebon, 14 Mei 1997',
        pekerjaan: 'Ibu Rumah Tangga',
        noWa: '0812-3456-8891',
        alamat: 'RT 02 / RW 01, Dusun II, Desa Susukan',
        tanggal: '15 Apr 2025',
        waktu: '10:30 WIB',
        keperluan: 'Beasiswa Pendidikan Anak SMKN 1 Susukan',
        status: 'Selesai',
        catatan: 'Telah ditandatangani secara elektronik (TTE BSrE) oleh Kuwu Desa Susukan.',
        berkas: ['KTP_SitiAminah.jpg', 'KK_SitiAminah.pdf'],
        nomorResmi: '470 / 0082 / Kesra / IV / 2025',
        qrToken: 'BSrE-SSK-2025-0082-8F2A'
      }
    ],
    bukuRegister: [
      {
        urut: '#0142',
        tanggal: '19 Apr 2025 • 14:15',
        nomorSurat: '470 / 0142 / Kesra / IV / 2025',
        kodeKlasifikasi: '470 (Kesejahteraan Rakyat)',
        singkatan: 'SKTM',
        jenisNama: 'Keterangan Tidak Mampu',
        seksi: 'Seksi Kesra',
        seksiKey: 'kesra',
        pemohon: 'Budi Santoso',
        nik: '320901••••••0012',
        alamat: 'RT 01 / RW 03, Dusun I',
        perihal: 'Persyaratan administrasi pengajuan beasiswa KIP-Kuliah Semester Gasal TA 2025/2026.',
        penandatangan: "H. Ma'ruf, S.Sos.",
        jabatan: 'Kuwu',
        legalitas: 'BSrE Terverifikasi',
        statusKey: 'tte'
      },
      {
        urut: '#0141',
        tanggal: '19 Apr 2025 • 11:30',
        nomorSurat: '510 / 0141 / Ekbang / IV / 2025',
        kodeKlasifikasi: '510 (Perdagangan & UMKM)',
        singkatan: 'SKU',
        jenisNama: 'Keterangan Usaha',
        seksi: 'Seksi Ekbang',
        seksiKey: 'ekbang',
        pemohon: 'Siti Nurjanah',
        nik: '320901••••••0028',
        alamat: 'RT 04 / RW 01, Dusun II',
        perihal: 'Pengajuan modal usaha mikro warung kelontong ke Bank BRI Unit Susukan.',
        penandatangan: "H. Ma'ruf, S.Sos.",
        jabatan: 'Kuwu',
        legalitas: 'BSrE Terverifikasi',
        statusKey: 'tte'
      }
    ],
    waLogs: [
      {
        id: 'LOG-8822',
        waktu: 'Hari ini, 10:15 WIB',
        penerima: 'Siti Aminah',
        noWa: '62812****8891',
        kategori: 'Surat Selesai (TTE)',
        status: 'Terkirim',
        pesan: 'Halo Siti Aminah, Surat Keterangan Tidak Mampu (SKTM) Anda telah selesai dan ditandatangani elektronik (TTE).'
      },
      {
        id: 'LOG-8821',
        waktu: 'Hari ini, 09:40 WIB',
        penerima: 'Budi Santoso',
        noWa: '62857****4211',
        kategori: 'Lolos Validasi',
        status: 'Terkirim',
        pesan: 'Halo Budi Santoso, berkas pengajuan SKT-0411 telah diverifikasi operator dan diteruskan ke Kuwu Desa Susukan.'
      }
    ],
    auditLogs: [
      {
        id: 'LOG-24583',
        waktu: '2025-04-19 10:15:02',
        aktor: 'Agus Setiawan (Admin)',
        kategori: 'Verifikasi Surat',
        aksi: 'VERIFY_SUBMISSION',
        target: 'SKD-0182',
        hash: 'a8f9c4e2910b7e12'
      }
    ],
    notifications: [
      {
        id: 'NOTIF-1',
        title: 'Surat SKTM-0344 Selesai & Terbit (TTE)',
        message: 'Surat Keterangan Tidak Mampu Anda telah ditandatangani Kuwu dan siap diunduh dalam format PDF ber-QR.',
        time: '15 Menit yang lalu',
        unread: true,
        targetScreen: 'layar_6_riwayat_pengajuan_warga'
      },
      {
        id: 'NOTIF-2',
        title: 'Perlu Perbaikan Berkas SKU-0398',
        message: 'Operator meminta unggah ulang foto e-KTP karena bagian NIK kurang jelas.',
        time: '1 Jam yang lalu',
        unread: true,
        targetScreen: 'layar_6_riwayat_pengajuan_warga'
      },
      {
        id: 'NOTIF-3',
        title: 'Antrean Verifikasi Baru (SKT-0411)',
        message: 'Budi Santoso mengajukan permohonan SKTM baru untuk Beasiswa KIP-Kuliah.',
        time: '2 Jam yang lalu',
        unread: false,
        targetScreen: 'layar_12_verifikasi_pengajuan_petugas_admin'
      }
    ],
    loginAttempts: {}
  };
}

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to read db.json, reinitializing:', e.message);
  }
  const initial = getInitialDb();
  saveDb(initial);
  return initial;
}

function saveDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

let db = loadDb();

// Discover all screen folders
function getScreenList() {
  if (!fs.existsSync(BASE_DIR)) return [];
  const dirs = fs.readdirSync(BASE_DIR).filter(d => {
    const full = path.join(BASE_DIR, d, 'code.html');
    return fs.existsSync(full);
  });

  return dirs.map(folder => {
    const htmlPath = path.join(BASE_DIR, folder, 'code.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    let title = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim().replace(/\s+/g, ' ') : '';
    if (!title) {
      title = folder.replace(/^layar_(\d+_)?/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
    let category = 'Eksekutif & Layanan Kecamatan';
    if (folder.includes('masuk_autentikasi')) category = 'Autentikasi & Login';
    else if (folder.match(/layar_(4|5|6)_/) || folder.includes('cetak_ulang') || folder.includes('sukses_surat')) category = 'Portal Warga (Desktop & HP)';
    else if (folder.match(/layar_1[2-9]_/)) category = 'Portal Admin Desa';
    else if (folder.includes('layar_20_')) category = 'Portal Kepala Desa (Kuwu)';
    else if (folder.includes('operator_loket') || folder.includes('tiket_antrean') || folder.includes('display_tv') || folder.includes('stok_blangko')) category = 'Operator Loket & Antrean e-KTP';
    else if (folder.includes('whatsapp')) category = 'Simulasi Bot & Notifikasi WhatsApp';

    return {
      id: folder,
      title,
      category,
      url: `/screen/${folder}`
    };
  });
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}

function injectRuntime(html, screenId) {
  const metaTag = `<script>window.__CURRENT_SCREEN_ID__ = ${JSON.stringify(screenId)};</script>\n<script src="/app-runtime.js"></script>`;
  if (html.includes('/app-runtime.js')) return html;
  if (html.includes('</body>')) {
    return html.replace('</body>', `${metaTag}\n</body>`);
  }
  return html + metaTag;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // Serve app-runtime.js
  if (pathname === '/app-runtime.js') {
    const runtimePath = path.join(__dirname, 'app-runtime.js');
    if (fs.existsSync(runtimePath)) {
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(fs.readFileSync(runtimePath, 'utf8'));
    }
  }

  // API Routes
  if (pathname === '/api/state' && req.method === 'GET') {
    return sendJson(res, 200, {
      ...db,
      screens: getScreenList()
    });
  }

  if (pathname === '/api/state' && req.method === 'POST') {
    const body = await parseBody(req);
    db = { ...db, ...body };
    saveDb(db);
    return sendJson(res, 200, { ok: true, db });
  }

  if (pathname === '/api/reset-demo' && req.method === 'POST') {
    db = getInitialDb();
    saveDb(db);
    return sendJson(res, 200, { ok: true, message: 'Data demo berhasil direset ke kondisi awal.', db });
  }

  if (pathname === '/api/auth/login' && req.method === 'POST') {
    const { identifier, password, role } = await parseBody(req);
    const key = (identifier || '').trim().toLowerCase();
    const now = Date.now();
    const attempt = db.loginAttempts[key] || { count: 0, lockUntil: 0 };

    if (attempt.lockUntil && now < attempt.lockUntil) {
      const waitSec = Math.ceil((attempt.lockUntil - now) / 1000);
      return sendJson(res, 429, {
        ok: false,
        locked: true,
        waitSec,
        message: `Akun dikunci sementara karena 5x gagal login. Coba lagi dalam ${waitSec} detik.`
      });
    }

    const user = db.users.find(u =>
      (u.identifier.toLowerCase() === key || (u.nik && u.nik === key)) &&
      u.password === password
    );

    if (!user) {
      attempt.count += 1;
      if (attempt.count >= 5) {
        attempt.lockUntil = now + 60 * 1000;
        attempt.count = 0;
      }
      db.loginAttempts[key] = attempt;
      saveDb(db);
      const remaining = 5 - attempt.count;
      return sendJson(res, 401, {
        ok: false,
        message: attempt.lockUntil > now
          ? 'Batas 5x percobaan gagal tercapai! Akun dikunci selama 1 menit.'
          : `Identitas atau kata sandi salah. Sisa percobaan: ${remaining} kali.`
      });
    }

    if (user.statusVerifikasi !== 'Aktif') {
      return sendJson(res, 403, {
        ok: false,
        message: 'Akun Anda masih menunggu verifikasi Admin Desa Susukan.'
      });
    }

    delete db.loginAttempts[key];
    db.auditLogs.unshift({
      id: 'LOG-' + Math.floor(24584 + Math.random() * 9000),
      waktu: new Date().toISOString().replace('T', ' ').slice(0, 19),
      aktor: `${user.nama} (${user.role.toUpperCase()})`,
      kategori: 'Autentikasi & Login',
      aksi: 'AUTH_LOGIN_SUCCESS',
      target: user.identifier,
      hash: crypto.createHash('sha256').update(user.identifier + now).digest('hex').slice(0, 16)
    });
    saveDb(db);

    let redirectScreen = 'layar_4_dashboard_warga_pelacakan_surat';
    if (user.role === 'admin' || role === 'admin') redirectScreen = 'layar_12_verifikasi_pengajuan_petugas_admin';
    if (user.role === 'kades' || role === 'kades') redirectScreen = 'layar_20_persetujuan_kepala_desa_kades';

    return sendJson(res, 200, {
      ok: true,
      user: {
        id: user.id,
        identifier: user.identifier,
        nik: user.nik,
        nama: user.nama,
        role: user.role,
        noHp: user.noHp,
        alamat: user.alamat
      },
      redirectUrl: `/screen/${redirectScreen}`
    });
  }

  if (pathname === '/api/auth/register' && req.method === 'POST') {
    const { nik, nama, noKk, noHp, alamat, password, setujuPrivasi } = await parseBody(req);
    const cleanNik = String(nik || '').replace(/\D/g, '');
    if (cleanNik.length !== 16) {
      return sendJson(res, 400, { ok: false, message: 'NIK wajib terdiri dari 16 digit angka.' });
    }
    if (!setujuPrivasi) {
      return sendJson(res, 400, { ok: false, message: 'Wajib menyetujui ketentuan privasi UU PDP.' });
    }
    if (db.users.some(u => u.nik === cleanNik) || db.warga.some(w => w.nik === cleanNik && w.statusAkun === 'Aktif')) {
      return sendJson(res, 409, { ok: false, message: 'NIK tersebut sudah terdaftar di sistem.' });
    }
    let normWa = String(noHp || '').replace(/\D/g, '');
    if (normWa.startsWith('0')) normWa = '62' + normWa.slice(1);
    else if (!normWa.startsWith('62')) normWa = '62' + normWa;

    const newUser = {
      id: 'USR-' + Date.now(),
      identifier: cleanNik,
      nik: cleanNik,
      nama: nama || 'Warga Baru Susukan',
      role: 'warga',
      password: password || 'warga123',
      noHp: normWa,
      alamat: alamat || 'RT 01 / RW 01, Desa Susukan',
      statusVerifikasi: 'Aktif',
      setujuPrivasi: true
    };
    db.users.push(newUser);
    db.warga.unshift({
      id: 'WRG-' + Date.now(),
      nik: cleanNik,
      nama: newUser.nama,
      noKk: noKk || cleanNik.slice(0, 12) + '0001',
      hubungan: 'Kepala KK',
      jk: 'Laki-laki',
      usia: 29,
      ttl: 'Cirebon, 01 Januari 1996',
      pekerjaan: 'Wiraswasta',
      alamat: newUser.alamat,
      dusun: 'dusun1',
      noWa: normWa,
      statusAkun: 'Menunggu Verifikasi'
    });
    db.notifications.unshift({
      id: 'NOTIF-' + Date.now(),
      title: `Pendaftaran Warga Baru: ${newUser.nama}`,
      message: `NIK ${cleanNik.slice(0, 6)}******${cleanNik.slice(-4)} mendaftar mandiri dan siap diverifikasi.`,
      time: 'Baru saja',
      unread: true,
      targetScreen: 'layar_13_data_warga_kk_admin'
    });
    saveDb(db);
    return sendJson(res, 200, {
      ok: true,
      message: `Pendaftaran berhasil! Nomor WA dinormalisasi ke ${normWa}. Anda dapat langsung masuk dengan NIK ${cleanNik}.`,
      user: newUser
    });
  }

  if (pathname === '/api/pengajuan' && req.method === 'POST') {
    const payload = await parseBody(req);
    if (payload.action === 'create') {
      const jenisObj = db.jenisSurat.find(j => j.id === payload.jenisId) || db.jenisSurat[0];
      const num = db.desaConfig.nomorUrutBerikutnya++;
      const prefix = jenisObj ? jenisObj.singkatan : 'SKD';
      const newId = `${prefix}-0${num}`;
      const item = {
        id: newId,
        jenisId: jenisObj.id,
        jenisNama: payload.jenisNama || jenisObj.nama,
        singkatan: jenisObj.singkatan,
        nik: payload.nik || '3209010101010004',
        nama: payload.nama || 'Siti Aminah',
        ttl: payload.ttl || 'Cirebon, 14 Mei 1997',
        pekerjaan: payload.pekerjaan || 'Wiraswasta',
        noWa: payload.noWa || '0812-3456-8891',
        alamat: payload.alamat || 'RT 02 / RW 01, Dusun II, Desa Susukan',
        tanggal: 'Hari ini',
        waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        keperluan: payload.keperluan || 'Keperluan Administrasi Kependudukan Desa Susukan',
        status: 'Menunggu',
        catatan: 'Permohonan baru diterima loket digital, menunggu verifikasi petugas.',
        berkas: payload.berkas || ['KTP_Elektronik.jpg', 'KK_Susukan.pdf'],
        nomorResmi: `${jenisObj.kode} / 0${num} / ${jenisObj.seksi} / IV / 2025`,
        qrToken: `BSrE-SSK-2025-0${num}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`
      };
      db.pengajuan.unshift(item);
      db.notifications.unshift({
        id: 'NOTIF-' + Date.now(),
        title: `Pengajuan Baru ${newId} (${item.singkatan})`,
        message: `${item.nama} mengajukan ${item.jenisNama} untuk: ${item.keperluan}`,
        time: 'Baru saja',
        unread: true,
        targetScreen: 'layar_12_verifikasi_pengajuan_petugas_admin'
      });
      db.auditLogs.unshift({
        id: 'LOG-' + Math.floor(25000 + Math.random() * 9000),
        waktu: new Date().toISOString().replace('T', ' ').slice(0, 19),
        aktor: `${item.nama} (Warga)`,
        kategori: 'Verifikasi Surat',
        aksi: 'CREATE_SUBMISSION',
        target: newId,
        hash: crypto.createHash('sha256').update(newId + Date.now()).digest('hex').slice(0, 16)
      });
      saveDb(db);
      return sendJson(res, 200, { ok: true, item, db });
    }

    if (payload.action === 'updateStatus') {
      const { id, status, catatan, aktor } = payload;
      const item = db.pengajuan.find(p => p.id === id) || db.pengajuan[0];
      if (item) {
        item.status = status;
        if (catatan) item.catatan = catatan;
        if (status === 'Selesai') {
          if (!item.nomorResmi || item.nomorResmi === '-') {
            const num = db.desaConfig.nomorUrutBerikutnya++;
            item.nomorResmi = `470 / 0${num} / Kesra / IV / 2025`;
            item.qrToken = `BSrE-SSK-2025-0${num}-TTE`;
          }
          // Add to bukuRegister if not already present
          if (!db.bukuRegister.some(r => r.nomorSurat === item.nomorResmi)) {
            db.bukuRegister.unshift({
              urut: `#0${db.bukuRegister.length + 143}`,
              tanggal: 'Hari ini • ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
              nomorSurat: item.nomorResmi,
              kodeKlasifikasi: '470 (Layanan Desa)',
              singkatan: item.singkatan || 'SURAT',
              jenisNama: item.jenisNama,
              seksi: 'Seksi Pelayanan',
              seksiKey: 'kesra',
              pemohon: item.nama,
              nik: item.nik.slice(0, 6) + '••••••' + item.nik.slice(-4),
              alamat: item.alamat,
              perihal: item.keperluan,
              penandatangan: db.desaConfig.namaKuwu,
              jabatan: 'Kuwu',
              legalitas: 'BSrE Terverifikasi',
              statusKey: 'tte'
            });
          }
        }
        db.waLogs.unshift({
          id: 'LOG-' + Math.floor(8825 + Math.random() * 1000),
          waktu: 'Baru saja',
          penerima: item.nama,
          noWa: item.noWa,
          kategori: `Status: ${status}`,
          status: 'Terkirim',
          pesan: `Halo ${item.nama}, status pengajuan surat ${item.id} (${item.jenisNama}) kini: ${status.toUpperCase()}. ${item.catatan || ''}`
        });
        db.notifications.unshift({
          id: 'NOTIF-' + Date.now(),
          title: `Status Berkas ${item.id}: ${status}`,
          message: `${item.jenisNama} a.n. ${item.nama} diperbarui menjadi "${status}".`,
          time: 'Baru saja',
          unread: true,
          targetScreen: status === 'Disetujui' ? 'layar_20_persetujuan_kepala_desa_kades' : 'layar_6_riwayat_pengajuan_warga'
        });
        db.auditLogs.unshift({
          id: 'LOG-' + Math.floor(25000 + Math.random() * 9000),
          waktu: new Date().toISOString().replace('T', ' ').slice(0, 19),
          aktor: aktor || 'Petugas Desa',
          kategori: status === 'Selesai' ? 'Penerbitan TTE' : 'Verifikasi Surat',
          aksi: `STATUS_${status.toUpperCase().replace(/\s+/g, '_')}`,
          target: item.id,
          hash: crypto.createHash('sha256').update(item.id + status + Date.now()).digest('hex').slice(0, 16)
        });
        saveDb(db);
      }
      return sendJson(res, 200, { ok: true, item, db });
    }
  }

  if (pathname === '/api/backup' && req.method === 'GET') {
    const cleanBackup = JSON.parse(JSON.stringify(db));
    if (Array.isArray(cleanBackup.users)) {
      cleanBackup.users.forEach(u => { delete u.password; });
    }
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="backup_desa_susukan_tanpa_password.json"'
    });
    return res.end(JSON.stringify(cleanBackup, null, 2));
  }

  // Root redirect or serve login screen
  if (pathname === '/' || pathname === '/index.html') {
    const loginHtmlPath = path.join(BASE_DIR, 'layar_1_masuk_autentikasi_warga', 'code.html');
    if (fs.existsSync(loginHtmlPath)) {
      const html = fs.readFileSync(loginHtmlPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(injectRuntime(html, 'layar_1_masuk_autentikasi_warga'));
    }
  }

  // Serve /screen/:screenId
  const screenMatch = pathname.match(/^\/screen\/([^\/]+)\/?$/);
  if (screenMatch) {
    const screenId = screenMatch[1];
    const htmlPath = path.join(BASE_DIR, screenId, 'code.html');
    if (fs.existsSync(htmlPath)) {
      const html = fs.readFileSync(htmlPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      return res.end(injectRuntime(html, screenId));
    }
  }

  // Serve direct folder access like /layar_.../code.html or /stitch_layanan_surat_online_desa_susukan/layar_.../code.html
  let candidatePath = path.join(__dirname, pathname);
  if (!fs.existsSync(candidatePath) || fs.statSync(candidatePath).isDirectory()) {
    const altPath = path.join(BASE_DIR, pathname);
    if (fs.existsSync(altPath)) candidatePath = altPath;
  }
  if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isDirectory()) {
    const indexInDir = path.join(candidatePath, 'code.html');
    if (fs.existsSync(indexInDir)) candidatePath = indexInDir;
  }

  if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()) {
    const ext = path.extname(candidatePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    if (ext === '.html') {
      const parentFolder = path.basename(path.dirname(candidatePath));
      const html = fs.readFileSync(candidatePath, 'utf8');
      res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-store' });
      return res.end(injectRuntime(html, parentFolder));
    }
    res.writeHead(200, { 'Content-Type': mime });
    return fs.createReadStream(candidatePath).pipe(res);
  }

  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;text-align:center;">
    <h2>Halaman tidak ditemukan (404)</h2>
    <p><a href="/" style="color:#176B5B;font-weight:bold;">Kembali ke Beranda Layanan Desa Susukan</a></p>
  </body></html>`);
});

server.listen(PORT, () => {
  console.log(`Server Layanan Surat Online Desa Susukan aktif di http://localhost:${PORT}`);
});

