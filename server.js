   // server.js
   const express = require('express');
   const session = require('express-session');
   const app = express();
   const port = 3000;
   const path = require('path');
   const figlet = require('figlet');
   const UniqueCode = require('./models/UniqueCode');
   const sequelize = require('./sequelize');

   // Middleware session
   app.use(session({
       secret: process.env.SESSION_SECRET || 'rahasia-session',
       resave: false,
       saveUninitialized: false,
       cookie: { secure: false } // Pastikan secure: true jika menggunakan HTTPS
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

   // Menggunakan import() secara dinamis untuk chalk
   (async () => {
       const chalk = (await import('chalk')).default;

       // Menampilkan nama dengan figlet dan chalk
       figlet('WibuDev - Subdomain', (err, data) => {
           if (err) {
               console.log('Terjadi kesalahan saat memuat figlet');
               return;
           }
           console.log(chalk.blue(data));
       });

       app.listen(port, () => {
           console.log(chalk.green(`Server berjalan di http://localhost:${port}`));
       });
   })();

   // Menambahkan sinkronisasi Sequelize
   sequelize.sync()
       .then(() => {
           console.log('Database terhubung dan model disinkronkan');
       })
       .catch((err) => {
           console.error('Gagal menyinkronkan database:', err);
       });