const express = require('express');
const router = express.Router();
const axios = require('axios');
const config = require('../config');
const { requireAuth } = require('../middleware/auth');

// Login page
router.get('/login', (req, res) => {
    res.render('admin/login', { title: 'Admin Login', error: null });
});

// Login process
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === config.admin.username && password === config.admin.password) {
        req.session.isAdmin = true;
        res.redirect('/admin/dashboard');
    } else {
        res.render('admin/login', { 
            title: 'Admin Login',
            error: 'Username atau password salah'
        });
    }
});

// Dashboard
router.get('/dashboard', requireAuth, async (req, res) => {
    try {
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
        
        const domains = response.data.result.filter(record => 
            record.type === 'A' && record.name.endsWith('wibudev.moe')
        );
        
        res.render('admin/dashboard', { 
            title: 'Admin Dashboard',
            domains 
        });
    } catch (error) {
        res.status(500).render('admin/dashboard', {
            title: 'Admin Dashboard',
            domains: [],
            error: 'Gagal mengambil data domain'
        });
    }
});

// Delete domain
router.post('/delete-domain', requireAuth, async (req, res) => {
    const { recordId } = req.body;
    
    try {
        await axios.delete(
            `https://api.cloudflare.com/client/v4/zones/${config.cloudflare.zoneId}/dns_records/${recordId}`,
            {
                headers: {
                    'X-Auth-Email': config.cloudflare.email,
                    'X-Auth-Key': config.cloudflare.apiKey,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting domain:', error.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Gagal menghapus domain' 
        });
    }
});

// Update domain
router.post('/update-domain', requireAuth, async (req, res) => {
    const { recordId, name, content } = req.body;
    
    try {
        await axios.put(
            `https://api.cloudflare.com/client/v4/zones/${config.cloudflare.zoneId}/dns_records/${recordId}`,
            {
                type: 'A',
                name: name,
                content: content,
                ttl: 3600,
                proxied: false
            },
            {
                headers: {
                    'X-Auth-Email': config.cloudflare.email,
                    'X-Auth-Key': config.cloudflare.apiKey,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Gagal mengupdate domain' 
        });
    }
});

// Tambahkan CNAME record
router.post('/add-cname', requireAuth, async (req, res) => {
    const { name, content } = req.body;
    
    try {
        const response = await axios.post(
            `https://api.cloudflare.com/client/v4/zones/${config.cloudflare.zoneId}/dns_records`,
            {
                type: 'CNAME',
                name: name,
                content: content,
                ttl: 3600,
                proxied: false
            },
            {
                headers: {
                    'X-Auth-Email': config.cloudflare.email,
                    'X-Auth-Key': config.cloudflare.apiKey,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        res.json({ success: true, data: response.data });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Gagal menambahkan CNAME record' 
        });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

// Refresh domains
router.get('/refresh-domains', requireAuth, async (req, res) => {
    try {
        // Contoh logika untuk memperbarui data domain
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

        // Misalnya, filter data yang diperlukan
        const updatedDomains = response.data.result.filter(record => 
            record.type === 'A' && record.name.endsWith('wibudev.moe')
        );

        // Lakukan sesuatu dengan data yang diperbarui, misalnya simpan ke database
        // await saveToDatabase(updatedDomains);

        res.json({ success: true, message: 'Data domain berhasil diperbarui', domains: updatedDomains });
    } catch (error) {
        console.error('Error refreshing domains:', error);
        res.status(500).json({ success: false, message: 'Gagal memperbarui data domain' });
    }
});

module.exports = router; 