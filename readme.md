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
   git clone https://github.com/jonito2005/wibudev-subdomain.git
   cd wibudev-subdomain
   ```

2. Install dependensi
   ```bash
   npm install
   ```

3. Buat database MySQL
   ```sql
   CREATE DATABASE wibudev;
   ```

4. Konfigurasi
   - Salin `config.js.example` ke `config.js`
     ```bash
     cp config.js.example config.js
     ```

   - Edit `config.js` dengan kredensial Anda:
     ```javascript
     module.exports = {
       cloudflare: {
         apiKey: 'CLOUDFLARE_API_KEY',
         email: 'CLOUDFLARE_EMAIL',
         zoneId: 'CLOUDFLARE_ZONE_ID'
       },
       admin: {
         username: 'ADMIN_USERNAME',
         password: 'ADMIN_PASSWORD'
       }
     };
     ```

5. Edit konfigurasi database di `sequelize.js`:
   ```javascript
   const sequelize = new Sequelize('wibudev', 'USERNAME', 'PASSWORD', {
     host: 'localhost',
     dialect: 'mysql'
   });
   ```

6. Jalankan aplikasi
   ```bash
   npm start
   ```

   Aplikasi akan berjalan di `http://localhost:3000`

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
