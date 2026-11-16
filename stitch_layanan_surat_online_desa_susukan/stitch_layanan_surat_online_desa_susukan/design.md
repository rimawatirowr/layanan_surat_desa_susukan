DESIGN.md — Layanan Surat Online Desa Susukan
Dokumen sistem desain untuk Sistem Informasi Pelayanan Surat Online Desa Susukan. Sumber acuan: prototype desa_susukan_ui.html (sudah memuat login, 3 peran, dan alur data).
1. Ringkasan Produk
Item Isi Nama Layanan Surat Online Desa Susukan Tujuan Warga mengajukan surat (domisili, SKTM, pengantar, usaha) secara online, petugas desa memproses, surat terbit dengan nomor otomatis dan QR Platform Web responsif (desktop dan HP), bisa dipasang sebagai PWA Bahasa Indonesia Karakter visual Resmi tapi hangat, minimalis, mudah dibaca warga awam dan lansia Gaya acuan Dashboard akademik CampusFlow: sidebar gelap berkelompok, kartu putih, timeline status
2. Peran Pengguna
Peran Login dengan Fokus Warga NIK 16 digit + password Ajukan, pantau, unduh surat Admin/Operator Username + password Verifikasi, data master, laporan, WA, backup Kepala Desa/Sekdes Username + password Menyetujui surat, nomor dan QR dibuat otomatis
Akun demo: 3209010101010001 / warga123, admin / admin123, kades / kades123.
3. Design Tokens
Warna
Token Hex Penggunaan --deep #0F3D3E Sidebar, latar login --green #176B5B Tombol utama, link, progress --gold #E8B95B Aksen, menu aktif, tombol sekunder utama --bg #F7F8F5 Latar halaman (ivory) --card #FFFFFF Kartu, topbar --ink #1E302D Teks utama --mut #74817D Teks pendukung --line #E7ECE8 Garis dan border --mint #E8F1ED Latar label, hover baris --red #D64545 Tolak, error, badge notifikasi --org #D97706 Perlu perbaikan --blue #3478C8 Informasi
Mode gelap: --bg #0C1B1A, --card #13292A, --ink #E6F0EC, --mut #93A9A2, --line #244240.
Warna Status Surat
Status Latar Teks Menunggu #FFF3DC #9A6100 Diverifikasi #E3EEFB #245A9E Perlu Perbaikan #FDEBD3 #B45309 Disetujui #E1F3EC #176B5B Ditolak #FBE4E4 #B02A2A Selesai #E1F3EC #0F5B49
Tipografi


Font: Inter, cadangan system-ui, Segoe UI, sans-serif

H1 26px / bold / letter-spacing -0.6px; H2 16px; isi 14px; tabel 13px

Label kecil (eyebrow/tag): 10px, huruf kapital, letter-spacing 1.5px, bold

Surat resmi (pratinjau/PDF): Georgia, serif, 12px, line-height 1.8
Bentuk dan Jarak


Radius: kartu 16px, tombol dan input 10px, chip 99px

Bayangan kartu: 0 8px 28px rgba(20,55,47,.06) (mode gelap: tanpa bayangan)

Jarak antar kartu 14px; padding kartu 18px; padding halaman 26px 28px

Lebar sidebar 244px; tinggi topbar 64px; lebar konten maks. 1360px
4. Layout
┌────────────┬──────────────────────────────────────────┐
│  SIDEBAR   │ TOPBAR: breadcrumb · cari (Ctrl+K) · 🔔   │
│  brand+    ├──────────────────────────────────────────┤
│  badge     │ Tag kecil                                 │
│  menu      │ Judul halaman           [tombol aksi]     │
│  berkelompok│ Subjudul                                  │
│  ─────     │ [Statistik ×4]                            │
│  user +    │ [Timeline / Grafik]                       │
│  Keluar    │ [Tabel / Form]                            │
└────────────┴──────────────────────────────────────────┘



Halaman login: layar penuh gradien hijau tua, satu kartu di tengah (maks. 420px), tanpa sidebar dan topbar.

Layar ≤ 900px: sidebar menjadi drawer (tombol ☰), grid statistik 2 kolom, grid dua kolom menjadi satu kolom, timeline 2 kolom, kolom cari disembunyikan.

Safe area HP: env(safe-area-inset-*) pada root.
5. Navigasi per Peran
Warga


LAYANAN WARGA: Dashboard · Ajukan Surat · Riwayat Pengajuan · Arsip Surat

AKUN & BANTUAN: Notifikasi (badge) · Panduan & Bantuan · Profil Saya
Admin


MANAJEMEN PELAYANAN: Dashboard · Verifikasi Pengajuan (badge) · Semua Pengajuan

DATA MASTER: Data Warga & KK (badge akun menunggu) · Jenis & Syarat Surat · Template & Nomor Surat

LAPORAN: Laporan & Buku Register

KOMUNIKASI: WhatsApp & Template

PENGATURAN: Audit Log · Profil Desa & Backup
Kades/Sekdes


PERSETUJUAN: Menunggu Persetujuan (badge) · Surat Disetujui
Aturan: menu peran lain tidak pernah ditampilkan. Menu aktif berlatar emas dengan teks hijau tua.
6. Komponen
Komponen Spesifikasi Sidebar Latar --deep, label grup 10px kapital, item 13px, badge merah untuk jumlah tugas Topbar Putih, sticky, breadcrumb Sistem / Peran / Halaman, tombol lonceng dengan titik merah Tag halaman Pil mint, teks hijau, kapital kecil Kartu statistik Label kapital 10px, angka 32px bold, keterangan 12px Timeline status 5 kartu: Menunggu, Diverifikasi, RT/RW, Disetujui, Selesai. Selesai bertanda ✓ dan bergaris hijau; tahap berjalan berlatar hijau penuh teks putih Tabel Header latar --bg kapital 10px, baris border atas, baris klik berlatar mint saat hover, bungkus overflow-x:auto Chip status Pil, 11px bold, warna sesuai tabel status Tombol Utama hijau, sekunder putih border, emas untuk aksi utama halaman, merah untuk tolak/hapus, oranye untuk perbaikan Form Label 12px bold di atas input, input radius 10px berlatar --bg Dialog Overlay gelap, kartu maks. 380px, tombol Batal dan Simpan/Ya Toast Bawah tengah, latar --deep, garis kiri emas, hilang sendiri 2,4 detik Grafik batang Murni CSS, tinggi sesuai jumlah (COUNT), tanpa library Kop surat Kartu putih, font serif, nomor, isi, tanda tangan, kotak QR
7. Alur dan Perilaku Fungsional
Alur status surat
Warga ajukan → Menunggu
Admin: Setujui   → Disetujui (masuk antrian Kades)
Admin: Perbaikan → Perlu Perbaikan (alasan wajib) → warga unggah ulang → Menunggu
Admin: Tolak     → Ditolak (alasan wajib)
Kades: Setujui   → Selesai (nomor surat + QR otomatis) → warga unduh PDF

Fungsi tombol dan fitur
Area Fungsi Login Validasi akun, batas 5 kali salah lalu terkunci 1 menit, akun harus sudah diverifikasi Daftar warga NIK harus 16 digit, cegah NIK ganda, WA dinormalkan ke 62…, wajib centang privasi, akun aktif setelah diverifikasi admin Lupa password OTP dikirim lewat WA (demo ditampilkan di toast), lalu password baru Ajukan surat Pilih jenis (dari Jenis Surat), untuk diri sendiri atau anggota KK, keperluan wajib, berkas JPG/PDF maks. 2 MB, centang persetujuan Revisi berkas Tombol Perbaiki di riwayat membuka dialog unggah ulang Notifikasi Dibuat otomatis tiap status berubah, tanda belum dibaca hilang setelah dibuka Arsip Unduh PDF surat (cetak ke PDF dari browser) dan unduh bukti pengajuan Verifikasi Klik baris, lihat detail, Setujui / Perbaikan / Tolak dengan dialog alasan Data warga Tambah, hapus (soft delete dengan konfirmasi), verifikasi akun, impor CSV, unduh template Jenis surat Tambah, ubah, hapus; syarat otomatis tampil di form warga Nomor surat Format dapat diubah, pratinjau nomor berikutnya langsung berubah Laporan Filter jenis, ekspor CSV (dibuka di Excel), cetak/PDF buku register WhatsApp Riwayat kirim, ubah template, kirim pesan uji Audit log Semua aksi penting tercatat, bisa diekspor Pengaturan desa Nama desa, kades, sekdes mengubah kop surat; backup JSON tanpa password Cari Kolom cari menyaring baris tabel di halaman aktif
Keterbatasan prototype
Data hanya di memori browser (hilang saat dimuat ulang). Pengiriman WA, penyimpanan database, QR yang bisa dipindai, dan login aman (hash password) memerlukan backend.
8. Aksesibilitas dan Keamanan UI


Kontras teks minimal 4.5:1; status tidak hanya dibedakan warna (selalu ada teks)

Target sentuh minimal 36px; ukuran huruf dasar 14px

Konfirmasi sebelum hapus, tolak, keluar, dan backup

Pesan error singkat dan ramah lewat toast

NIK ditampilkan sebagian (4 digit awal dan akhir) di tabel

Jangan menampilkan NIK lengkap atau isi surat di notifikasi WA

Opsional lanjutan: mode huruf besar untuk lansia
9. Data Model Singkat (untuk backend)
users (nik, nama, password_hash, role, no_hp, status_verifikasi, setuju_privasi) · warga · kk · jenis_surat (nama, syarat, penandatangan, template) · pengajuan (user_id, jenis_id, keperluan, berkas, status, alasan) · surat (pengajuan_id, nomor, tanggal_terbit, qr_token, cetak_ke) · desa · audit_log · wa_log · wa_template
9b. Teknologi Disarankan
Laravel atau Node.js + Express, MySQL, DomPDF/PDFKit, Laravel Excel/ExcelJS, gateway WhatsApp (Fonnte atau Cloud API) lewat webhook, Bootstrap/Tailwind.
10. Checklist Kualitas


[ ] Semua tombol punya fungsi dan umpan balik (toast/dialog)

[ ] Setiap peran hanya melihat menunya sendiri

[ ] Layout nyaman di lebar 360px

[ ] Mode gelap terbaca

[ ] Data uji memakai nama fiktif, bukan data warga asli