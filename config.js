   // config.js
require('dotenv').config();

module.exports = {
    database: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        name: process.env.DB_NAME || 'wibudev-subdomain'
    },
    cloudflare: {
        apiKey: process.env.CLOUDFLARE_API_KEY,
        email: process.env.CLOUDFLARE_EMAIL,
        zoneId: process.env.CLOUDFLARE_ZONE_ID
    },
    admin: {
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'password'
    },
    session: {
        secret: process.env.SESSION_SECRET || 'rahasia-session'
    },
    app: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development'
    }
};