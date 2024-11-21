const config = require('../config');

function requireAuth(req, res, next) {
    const auth = req.session?.isAdmin;
    
    if (auth) {
        next();
    } else {
        res.redirect('/admin/login');
    }
}

function checkSubdomainAuth(req, res, next) {
    if (req.session.uniqueCode) {
        return next();
    }
    res.redirect('/login');
}

module.exports = { requireAuth, checkSubdomainAuth }; 