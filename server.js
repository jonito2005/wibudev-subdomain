   // server.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const app = express();
const port = process.env.PORT || 3001;
const path = require('path');
const figlet = require('figlet');
const { init: initDB } = require('./sequelize');

async function startServer() {
    try {
        // Import chalk secara dinamis
        const chalk = (await import('chalk')).default;
        
        // Inisialisasi database
        await initDB();
        
        // Middleware session
        app.use(session({
            secret: process.env.SESSION_SECRET || 'rahasia-session',
            resave: false,
            saveUninitialized: false,
            cookie: { secure: process.env.NODE_ENV === 'production' }
        }));

        // Middleware untuk menetapkan baseUrl
        app.use((req, res, next) => {
            res.locals.baseUrl = `${req.protocol}://${req.get('host')}`;
            next();
        });

        // Set view engine
        app.set('view engine', 'ejs');

        // Middleware untuk parsing JSON
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        app.use(express.static('public'));

        // Import routes
        const indexRouter = require('./routes/index');
        const adminRouter = require('./routes/admin');

        // Use routes
        app.use('/', indexRouter);
        app.use('/admin', adminRouter);

        // Menampilkan nama dengan figlet
        figlet('WibuDev - Subdomain', (err, data) => {
            if (err) {
                console.log('Terjadi kesalahan saat memuat figlet');
                return;
            }
            console.log(chalk.blue(data));
        });

        // Mulai server
        app.listen(port, () => {
            console.log(chalk.green(`Server berjalan di http://localhost:${port}`));
        });
    } catch (error) {
        console.error('Gagal menjalankan server:', error);
        process.exit(1);
    }
}

// Jalankan server
startServer();