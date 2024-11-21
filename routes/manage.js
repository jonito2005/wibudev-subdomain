const express = require('express');
const router = express.Router();
const UniqueCode = require('../models/UniqueCode');
const { checkSubdomainAuth } = require('../middleware/auth');

// Endpoint untuk mengedit subdomain
router.post('/edit-subdomain', checkSubdomainAuth, async (req, res) => {
    const { subdomain, serverIP, proxyStatus } = req.body;
    const uniqueCode = req.session.uniqueCode;

    try {
        await UniqueCode.update(
            { subdomain, serverIP, proxyStatus },
            { where: { code: uniqueCode } }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengupdate subdomain' });
    }
});

// Endpoint untuk menghapus subdomain
router.post('/delete-subdomain', checkSubdomainAuth, async (req, res) => {
    const uniqueCode = req.session.uniqueCode;

    try {
        await UniqueCode.destroy({ where: { code: uniqueCode } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal menghapus subdomain' });
    }
});

module.exports = router;