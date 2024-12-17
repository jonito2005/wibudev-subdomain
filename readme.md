![screencapture-localhost-3001-2024-12-17-23_51_08](https://github.com/user-attachments/assets/3a375d05-4d6c-4c96-8720-50c2e5781456)

# WibuDev Subdomain Manager

Sistem manajemen subdomain terintegrasi dengan Cloudflare yang memungkinkan pengguna untuk membuat dan mengelola subdomain dengan mudah.

## Fitur

- ✨ Pembuatan subdomain otomatis
- 🔒 Integrasi dengan Cloudflare Proxy
- 👥 Sistem autentikasi dengan kode unik
- 📱 Responsive design
- 🎨 Antarmuka modern dengan animasi
- ⚡ Rate limiting (1 subdomain per IP per jam)
- 🔍 Pencarian domain
- 📊 Dashboard admin

## Prasyarat

- Node.js (v14 atau lebih baru)
- MySQL
- Akun Cloudflare dengan domain yang terdaftar

## Instalasi

1. Clone repositori
   ```bash
   git clone https://github.com/username/wibudev-subdomain.git
   cd wibudev-subdomain
   ```

2. Install dependensi
   ```bash
   npm install
   ```

3. Database akan dibuat secara otomatis saat pertama kali menjalankan aplikasi

4. Konfigurasi
   - Salin `example.env` ke `.env`
     ```bash
     cp example.env .env
     ```

   - Edit `.env` dengan kredensial Anda:
     ```env
     # Database
     DB_HOST=localhost
     DB_USER=root
     DB_PASS=password
     DB_NAME=wibudev-subdomain

     # Cloudflare
     CLOUDFLARE_API_KEY=your_api_key
     CLOUDFLARE_EMAIL=your_email
     CLOUDFLARE_ZONE_ID=your_zone_id

     # Session
     SESSION_SECRET=your_session_secret

     # Admin
     ADMIN_USERNAME=admin
     ADMIN_PASSWORD=password

     # Konfigurasi Aplikasi
     PORT=3001
     ```

5. Jalankan aplikasi
   ```bash
   npm run dev
   npm start
   ```
   
   Aplikasi akan berjalan di `http://localhost:3001`

## Penggunaan

### Pengguna Biasa

1. Buka halaman utama
2. Masukkan nama subdomain yang diinginkan
3. Masukkan IP server
4. Pilih status proxy Cloudflare
5. Klik "Dapatkan Subdomain"
6. Simpan kode unik yang diberikan

### Mengelola Subdomain

1. Klik "Login" di halaman utama
2. Masukkan kode unik yang diberikan
3. Anda dapat mengedit atau menghapus subdomain

### Admin Panel

1. Akses `/admin/login`
2. Login dengan kredensial admin
3. Kelola semua subdomain yang terdaftar

## Keamanan

- Rate limiting per IP
- Validasi input
- Proteksi CSRF
- Session management
- Cloudflare proxy protection (opsional)

## Teknologi

- Express.js
- Sequelize ORM
- MySQL
- EJS Template Engine
- Tailwind CSS
- GSAP Animations
- Particles.js
- SweetAlert2
- Font Awesome

## Lisensi

MIT License - lihat file [LICENSE](LICENSE) untuk detail lengkap.

## Kontribusi

1. Fork repositori
2. Buat branch fitur (`git checkout -b fitur/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Menambahkan fitur'`)
4. Push ke branch (`git push origin fitur/AmazingFeature`)
5. Buat Pull Request

## Kontak

Jonito - [@wibudev](https://facebook.com/jonitodesade)

Project Link: [https://github.com/jonito2005/wibudev-subdomain](https://github.com/jonito2005/wibudev-subdomain)

## Penghargaan

- [Express.js](https://expressjs.com)
- [Sequelize](https://sequelize.org)
- [Cloudflare](https://cloudflare.com)
- [Tailwind CSS](https://tailwindcss.com)
