   // routes/index.js
   const express = require('express');
   const axios = require('axios');
   const config = require('../config');
   const router = express.Router();
   const requestIp = require('request-ip');
   const { checkSubdomainAuth } = require('../middleware/auth');
   const { v4: uuidv4 } = require('uuid');
   const UniqueCode = require('../models/UniqueCode');
   const rateLimit = require('express-rate-limit');
   
   // Limit 1 domain per IP
   const ipLimits = new Map();
   
   // Middleware untuk mendapatkan client IP secara akurat
   router.use(requestIp.mw());
   
   // Fungsi untuk mengecek IP limit
   function checkIPLimit(clientIP) {
       const now = Date.now();
       const oneHour = 60 * 60 * 1000; // 1 jam dalam milliseconds
   
       if (ipLimits.has(clientIP)) {
           const lastCreation = ipLimits.get(clientIP);
           if (now - lastCreation < oneHour) {
               return false; // Masih dalam periode cooldown
           }
       }
   
       // Update timestamp untuk IP ini
       ipLimits.set(clientIP, now);
       return true;
   }
   
   // Fungsi untuk menambahkan data IP
   function addIPLimit(ip) {
       ipLimits.set(ip, {
           timestamp: Date.now(),
           count: 1
       });
   }
   
   // Fungsi untuk menambahkan subdomain
   async function addSubdomain(subdomain, serverIP, proxyStatus) {
       const url = `https://api.cloudflare.com/client/v4/zones/${config.cloudflare.zoneId}/dns_records`;
       const data = {
           type: 'A',
           name: `${subdomain}.wibudev.moe`,
           content: serverIP,
           ttl: 3600,
           proxied: proxyStatus
       };
   
       const headers = {
           'X-Auth-Email': config.cloudflare.email,
           'X-Auth-Key': config.cloudflare.apiKey,
           'Content-Type': 'application/json'
       };
   
       try {
           const response = await axios.post(url, data, { headers });
           return response.data;
       } catch (error) {
           console.error('Error adding subdomain:', error.response?.data || error.message);
           throw error;
       }
   }
   
   // Halaman utama
   router.get('/', async (req, res) => {
       try {
           const page = parseInt(req.query.page) || 1;
           const limit = 5;
   
           const response = await axios.get(
               `https://api.cloudflare.com/client/v4/zones/${config.cloudflare.zoneId}/dns_records`,
               {
                   headers: {
                       'X-Auth-Email': config.cloudflare.email,
                       'X-Auth-Key': config.cloudflare.apiKey,
                       'Content-Type': 'application/json'
                   }
               }
           );
   
           const allDomains = response.data.result.filter(record =>
               record.type === 'A' && record.name.endsWith('wibudev.moe')
           );
   
           // Sort domains by created date (newest first)
           allDomains.sort((a, b) => new Date(b.created_on) - new Date(a.created_on));
   
           // Calculate pagination
           const startIndex = (page - 1) * limit;
           const endIndex = page * limit;
           const totalPages = Math.ceil(allDomains.length / limit);
           const domains = allDomains.slice(startIndex, endIndex);
   
           res.render('pages/index', {
               title: 'WibuDev - Subdomain',
               domains,
               currentPage: page,
               totalPages,
               totalDomains: allDomains.length
           });
       } catch (error) {
           console.error('Error fetching domains:', error);
           res.render('pages/index', {
               title: 'WibuDev - Subdomain',
               domains: [],
               currentPage: 1,
               totalPages: 1,
               totalDomains: 0
           });
       }
   });
   
   // Fungsi untuk mengecek duplikat subdomain
   async function checkDuplicateSubdomain(subdomain) {
       try {
           const response = await axios.get(
               `https://api.cloudflare.com/client/v4/zones/${config.cloudflare.zoneId}/dns_records`,
               {
                   headers: {
                       'X-Auth-Email': config.cloudflare.email,
                       'X-Auth-Key': config.cloudflare.apiKey,
                       'Content-Type': 'application/json'
                   },
                   params: {
                       type: 'A', // atau tipe record lain sesuai kebutuhan
                       name: `${subdomain}.wibudev.moe`
                   }
               }
           );
   
           if (response.data.success) {
               return response.data.result; // Array subdomain yang ada
           } else {
               console.error('Cloudflare API Error:', response.data.errors);
               throw new Error('Cloudflare API Error');
           }
       } catch (error) {
           console.error('Error checking duplicate subdomain:', error.response?.data || error.message);
           throw error;
       }
   }
   
   // Fungsi untuk mengecek jika subdomain sudah ada di database
   async function isSubdomainExists(subdomain) {
       const existing = await UniqueCode.findOne({ where: { subdomain: subdomain } });
       return !!existing;
   }
   
   // Batas rate khusus untuk endpoint mendapatkan subdomain
   const getSubdomainLimiter = rateLimit({
       windowMs: 15 * 60 * 1000, // 15 menit
       max: 5, // Maksimal 5 permintaan per IP dalam windowMs
       message: {
           success: false,
           message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.'
       }
   });
   
   // Endpoint untuk mendapatkan subdomain
   router.post('/get-subdomain', getSubdomainLimiter, async (req, res) => {
       const clientIP = req.clientIp;
       const { desiredSubdomain, serverIP, proxyStatus } = req.body;
   
       console.log('Menerima permintaan pembuatan subdomain dari IP:', clientIP);
       console.log('Subdomain:', desiredSubdomain, 'Server IP:', serverIP, 'Proxy Status:', proxyStatus);
       console.log('Request body:', req.body);
   
       try {
           // Cek apakah subdomain sudah ada
           const existingSubdomain = await UniqueCode.findOne({
               where: { subdomain: `${desiredSubdomain}.wibudev.moe` }
           });
   
           if (existingSubdomain) {
               return res.status(400).json({
                   success: false,
                   message: 'Subdomain sudah digunakan'
               });
           }
   
           // Tambahkan record ke Cloudflare
           const cloudflareRecord = await addCloudflareRecord(desiredSubdomain, serverIP, proxyStatus);
   
           // Generate unique code
           const uniqueCode = uuidv4();
   
           // Simpan ke database
           await UniqueCode.create({
               code: uniqueCode,
               subdomain: `${desiredSubdomain}.wibudev.moe`,
               serverIP,
               proxyStatus
           });
   
           res.json({
               success: true,
               message: 'Subdomain berhasil dibuat',
               uniqueCode,
               subdomain: `${desiredSubdomain}.wibudev.moe`
           });
   
       } catch (error) {
           console.error('Error creating subdomain:', error);
   
           // Hapus record dari database jika ada error
           if (error.code !== 'SUBDOMAIN_EXISTS') {
               await UniqueCode.destroy({
                   where: { code: uniqueCode }
               });
           }
   
           res.status(500).json({
               success: false,
               message: 'Gagal membuat subdomain di layanan Cloudflare.'
           });
       }
   });
   
   router.get('/ketentuan-dan-layanan', (req, res) => {
       res.render('pages/terms', { title: 'Ketentuan & Layanan' });
   });
   
   // Halaman manajemen subdomain
   router.get('/manage-subdomain', checkSubdomainAuth, async (req, res) => {
       const uniqueCode = req.session.uniqueCode;
       const subdomainData = await UniqueCode.findOne({ where: { code: uniqueCode } });
   
       res.render('pages/manage-subdomain', {
           title: 'Kelola Subdomain Anda',
           subdomainData
       });
   });
   
   // Endpoint untuk mengedit subdomain
   router.post('/edit-subdomain', checkSubdomainAuth, async (req, res) => {
       const { subdomain, serverIP, proxyStatus } = req.body;
       const uniqueCode = req.session.uniqueCode;
   
       try {
           // Update di Cloudflare
           const cloudflareUpdated = await updateCloudflareRecord(subdomain, serverIP, proxyStatus);
           if (!cloudflareUpdated) {
               throw new Error('Gagal mengupdate DNS di Cloudflare');
           }
   
           // Update di database
           await UniqueCode.update(
               { subdomain, serverIP, proxyStatus },
               { where: { code: uniqueCode } }
           );
   
           res.json({ success: true });
       } catch (error) {
           res.status(500).json({
               success: false,
               message: error.message || 'Gagal mengupdate subdomain'
           });
       }
   });
   
   // Endpoint untuk menghapus subdomain
   router.post('/delete-subdomain', checkSubdomainAuth, async (req, res) => {
       const uniqueCode = req.session.uniqueCode;
   
       try {
           // Ambil data subdomain sebelum dihapus
           const subdomainData = await UniqueCode.findOne({ where: { code: uniqueCode } });
           if (!subdomainData) {
               throw new Error('Subdomain tidak ditemukan');
           }
   
           // Hapus dari Cloudflare
           const fullDomain = subdomainData.subdomain.endsWith('.wibudev.moe') ? subdomainData.subdomain : `${subdomainData.subdomain}.wibudev.moe`;
           const cloudflareDeleted = await deleteCloudflareRecord(fullDomain);
           if (!cloudflareDeleted) {
               throw new Error('Gagal menghapus DNS di Cloudflare');
           }
   
           // Hapus dari database
           await UniqueCode.destroy({ where: { code: uniqueCode } });
           req.session.destroy();
   
           res.json({ success: true });
       } catch (error) {
           res.status(500).json({
               success: false,
               message: error.message || 'Gagal menghapus subdomain'
           });
       }
   });
   
   // Halaman login
   router.get('/login', (req, res) => {
       res.render('pages/login', {
           title: 'Login - WibuDev',
           error: null
       });
   });
   
   // Proses login
   router.post('/login', async (req, res) => {
       const { uniqueCode } = req.body;
   
       try {
           const validCode = await UniqueCode.findOne({ where: { code: uniqueCode } });
           if (validCode) {
               req.session.uniqueCode = uniqueCode;
               res.redirect('/manage-subdomain');
           } else {
               res.render('pages/login', {
                   title: 'Login - WibuDev',
                   error: 'Kode Unik tidak valid. Silakan coba lagi.'
               });
           }
       } catch (error) {
           console.error('Error saat login:', error);
           res.status(500).send('Terjadi kesalahan pada server.');
       }
   });
   
   function generateUniqueCode() {
       return uuidv4();
   }
   
   // Fungsi untuk update DNS di Cloudflare
   async function updateCloudflareRecord(subdomain, serverIP, proxyStatus) {
       try {
           const records = await axios.get(
               `https://api.cloudflare.com/client/v4/zones/${config.cloudflare.zoneId}/dns_records`,
               {
                   headers: {
                       'X-Auth-Email': config.cloudflare.email,
                       'X-Auth-Key': config.cloudflare.apiKey,
                   }
               }
           );
   
           const record = records.data.result.find(r => r.name === subdomain);
   
           if (record) {
               await axios.put(
                   `https://api.cloudflare.com/client/v4/zones/${config.cloudflare.zoneId}/dns_records/${record.id}`,
                   {
                       type: 'A',
                       name: subdomain,
                       content: serverIP,
                       ttl: 1,
                       proxied: proxyStatus
                   },
                   {
                       headers: {
                           'X-Auth-Email': config.cloudflare.email,
                           'X-Auth-Key': config.cloudflare.apiKey,
                           'Content-Type': 'application/json'
                       }
                   }
               );
               return true;
           }
           return false;
       } catch (error) {
           console.error('Error updating Cloudflare:', error);
           return false;
       }
   }
   
   // Fungsi untuk delete DNS di Cloudflare
   async function deleteCloudflareRecord(subdomain) {
       try {
           const records = await axios.get(
               `https://api.cloudflare.com/client/v4/zones/${config.cloudflare.zoneId}/dns_records`,
               {
                   headers: {
                       'X-Auth-Email': config.cloudflare.email,
                       'X-Auth-Key': config.cloudflare.apiKey,
                   }
               }
           );
   
           const fullDomain = subdomain.endsWith('.wibudev.moe') ? subdomain : `${subdomain}.wibudev.moe`;
           const record = records.data.result.find(r => r.name === fullDomain);
   
           if (record) {
               await axios.delete(
                   `https://api.cloudflare.com/client/v4/zones/${config.cloudflare.zoneId}/dns_records/${record.id}`,
                   {
                       headers: {
                           'X-Auth-Email': config.cloudflare.email,
                           'X-Auth-Key': config.cloudflare.apiKey,
                       }
                   }
               );
               return true;
           }
           return false;
       } catch (error) {
           console.error('Error deleting from Cloudflare:', error);
           return false;
       }
   }
   
   // Endpoint untuk mengecek ketersediaan subdomain
   router.post('/check-subdomain', async (req, res) => {
       const { subdomain } = req.body;
   
       try {
           // Cek di database - perbaiki format subdomain yang dicek
           const existingSubdomain = await UniqueCode.findOne({
               where: {
                   subdomain: subdomain // Hapus .wibudev.moe karena di database tidak menyimpan domain lengkap
               }
           });
   
           // Cek di Cloudflare
           const cloudflareResponse = await axios.get(
               `https://api.cloudflare.com/client/v4/zones/${config.cloudflare.zoneId}/dns_records`,
               {
                   headers: {
                       'X-Auth-Email': config.cloudflare.email,
                       'X-Auth-Key': config.cloudflare.apiKey,
                   }
               }
           );
   
           const cloudflareRecords = cloudflareResponse.data.result;
           const existsInCloudflare = cloudflareRecords.some(record =>
               record.name.toLowerCase() === `${subdomain}.wibudev.moe`.toLowerCase()
           );
   
           // Subdomain tersedia jika tidak ada di database dan Cloudflare
           const isAvailable = !existingSubdomain && !existsInCloudflare;
   
           res.json({
               available: isAvailable,
               message: isAvailable ? 'Subdomain tersedia' : 'Subdomain sudah digunakan'
           });
   
       } catch (error) {
           console.error('Error checking subdomain:', error);
           res.status(500).json({
               available: false,
               message: 'Terjadi kesalahan saat mengecek subdomain'
           });
       }
   });
   
   // Endpoint untuk membuat subdomain baru
   router.post('/create-subdomain', async (req, res) => {
       const { subdomain, serverIP, proxyStatus } = req.body;
       const clientIP = requestIp.getClientIp(req);
   
       try {
           // Cek IP limit
           if (!checkIPLimit(clientIP)) {
               return res.status(429).json({
                   success: false,
                   message: 'Anda telah mencapai batas pembuatan subdomain. Silakan coba lagi dalam 1 jam.'
               });
           }
   
           // Validasi input
           if (!subdomain || !serverIP) {
               return res.status(400).json({
                   success: false,
                   message: 'Subdomain dan IP Server harus diisi'
               });
           }
   
           // Generate kode unik
           const uniqueCode = uuidv4();
   
           // Buat record di Cloudflare
           const cloudflareResponse = await axios.post(
               `https://api.cloudflare.com/client/v4/zones/${config.cloudflare.zoneId}/dns_records`,
               {
                   type: 'A',
                   name: `${subdomain}.wibudev.moe`,
                   content: serverIP,
                   proxied: proxyStatus
               },
               {
                   headers: {
                       'X-Auth-Email': config.cloudflare.email,
                       'X-Auth-Key': config.cloudflare.apiKey,
                       'Content-Type': 'application/json'
                   }
               }
           );
   
           if (!cloudflareResponse.data.success) {
               throw new Error('Gagal membuat DNS record di Cloudflare');
           }
   
           // Simpan ke database
           await UniqueCode.create({
               code: uniqueCode,
               subdomain: subdomain,
               serverIP: serverIP,
               proxyStatus: proxyStatus
           });
   
           // Update IP limit
           ipLimits.set(clientIP, Date.now());
   
           // Perbaiki response dengan memastikan uniqueCode terkirim
           return res.json({
               success: true,
               message: 'Subdomain berhasil dibuat!',
               data: {
                   uniqueCode: uniqueCode, // Pastikan ini terkirim
                   subdomain: `${subdomain}.wibudev.moe`,
                   serverIP,
                   proxyStatus
               }
           });
   
       } catch (error) {
           console.error('Error creating subdomain:', error);
           res.status(500).json({
               success: false,
               message: error.message || 'Terjadi kesalahan saat membuat subdomain'
           });
       }
   });
   
   // Fungsi untuk menambahkan subdomain ke Cloudflare
   async function addSubdomainToCloudflare(subdomain, serverIP, proxyStatus) {
       try {
           const response = await axios.post(
               `https://api.cloudflare.com/client/v4/zones/${config.cloudflare.zoneId}/dns_records`,
               {
                   type: 'A',
                   name: `${subdomain}.wibudev.moe`,
                   content: serverIP,
                   proxied: proxyStatus
               },
               {
                   headers: {
                       'X-Auth-Email': config.cloudflare.email,
                       'X-Auth-Key': config.cloudflare.apiKey,
                       'Content-Type': 'application/json'
                   }
               }
           );
   
           if (!response.data.success) {
               throw new Error(response.data.errors[0].message || 'Gagal menambahkan DNS record');
           }
   
           return response.data.result;
       } catch (error) {
           console.error('Cloudflare API Error:', error.response?.data || error.message);
           throw new Error('Gagal menambahkan subdomain ke Cloudflare');
       }
   }
   
   // Fungsi untuk menambahkan subdomain ke Cloudflare
   async function addCloudflareRecord(subdomain, serverIP, proxyStatus) {
       try {
           const response = await axios.post(
               `https://api.cloudflare.com/client/v4/zones/${config.cloudflare.zoneId}/dns_records`,
               {
                   type: 'A',
                   name: `${subdomain}.wibudev.moe`,
                   content: serverIP,
                   proxied: proxyStatus
               },
               {
                   headers: {
                       'X-Auth-Email': config.cloudflare.email,
                       'X-Auth-Key': config.cloudflare.apiKey,
                       'Content-Type': 'application/json'
                   }
               }
           );
   
           if (!response.data.success) {
               console.error('Cloudflare API Error:', response.data.errors);
               throw new Error(response.data.errors[0].message || 'Gagal menambahkan DNS record');
           }
   
           return response.data.result;
       } catch (error) {
           console.error('Cloudflare API Error:', error.response?.data || error.message);
           throw new Error('Gagal menambahkan subdomain ke Cloudflare');
       }
   }
   
   // IP Address Checker
   router.get('/get-ip', (req, res) => {
       const clientIp = requestIp.getClientIp(req);
       res.json({ ip: clientIp });
   });
   
   // Bersihkan data IP yang sudah lebih dari 1 jam setiap 30 menit
   setInterval(() => {
       const now = Date.now();
       const oneHour = 60 * 60 * 1000;
   
       for (const [ip, timestamp] of ipLimits.entries()) {
           if (now - timestamp >= oneHour) {
               ipLimits.delete(ip);
           }
       }
   }, 30 * 60 * 1000); // Jalankan setiap 30 menit
   
   module.exports = router;