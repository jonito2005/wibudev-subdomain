   // routes/index.js
   const express = require('express');
   const axios = require('axios');
   const config = require('../config');
   const router = express.Router();
   const requestIp = require('request-ip');
   const { checkSubdomainAuth } = require('../middleware/auth');
   const { v4: uuidv4 } = require('uuid');
   const UniqueCode = require('../models/UniqueCode');

   // Limit 1 domain per IP
   const ipLimits = new Map();

   // Middleware untuk mendapatkan client IP secara akurat
   router.use(requestIp.mw());

   // Fungsi untuk mengecek limit IP
   function checkIPLimit(ip) {
       if (!ipLimits.has(ip)) {
           return true;
       }

       const ipData = ipLimits.get(ip);
       const now = Date.now();
       const oneHour = 60 * 60 * 1000; // 1 jam dalam milidetik

       // Cek apakah sudah melewati cooldown 1 jam
       if (now - ipData.timestamp >= oneHour) {
           ipLimits.delete(ip);
           return true;
       }

       return false;
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

   // Endpoint untuk mendapatkan subdomain
   router.post('/get-subdomain', async (req, res) => {
       const clientIP = req.clientIp;
       const { desiredSubdomain, serverIP, proxyStatus } = req.body;

       console.log(`Menerima permintaan pembuatan subdomain dari IP: ${clientIP}`);
       console.log(`Subdomain: ${desiredSubdomain}, Server IP: ${serverIP}, Proxy Status: ${proxyStatus}`);

       if (!checkIPLimit(clientIP)) {
           console.log('IP telah mencapai batas pembuatan subdomain.');
           return res.json({ 
               success: false, 
               message: 'Anda harus menunggu 1 jam sebelum membuat subdomain baru' 
           });
       }

       try {
           const result = await addSubdomain(desiredSubdomain, serverIP, proxyStatus);
           if (result.success) {
               addIPLimit(clientIP);
               const uniqueCode = generateUniqueCode();
               
               await UniqueCode.create({
                   code: uniqueCode,
                   subdomain: `${desiredSubdomain}.wibudev.moe`,
                   serverIP,
                   proxyStatus
               });

               req.session.uniqueCode = uniqueCode;

               console.log(`Subdomain berhasil dibuat: ${uniqueCode}`);
               res.json({ 
                   success: true, 
                   subdomain: `${desiredSubdomain}.wibudev.moe`,
                   serverIP: serverIP,
                   proxied: proxyStatus,
                   uniqueCode: uniqueCode
               });
           } else {
               console.log('Gagal membuat subdomain di layanan Cloudflare.');
               res.json({ success: false, message: 'Gagal membuat subdomain' });
           }
       } catch (error) {
           console.error('Error di /get-subdomain:', error);
           res.status(500).json({ success: false, message: 'Internal server error' });
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
           const cloudflareDeleted = await deleteCloudflareRecord(subdomainData.subdomain);
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
           
           const record = records.data.result.find(r => r.name === subdomain);
           
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

   module.exports = router;