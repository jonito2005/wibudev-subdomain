const Sequelize = require('sequelize').Sequelize;
const mysql = require('mysql2/promise');
const config = require('./config');

let sequelize = null;

// Fungsi untuk membuat database jika belum ada
async function createDatabaseIfNotExists() {
    // Import ora secara dinamis
    const ora = (await import('ora')).default;
    const spinner = ora({
        text: 'Memeriksa database...',
        color: 'blue'
    }).start();
    
    try {
        // Buat koneksi tanpa memilih database
        spinner.text = '🔄 Menghubungkan ke MySQL...';
        const connection = await mysql.createConnection({
            host: config.database.host,
            user: config.database.user,
            password: config.database.password
        });

        // Buat database jika belum ada
        spinner.text = '📁 Membuat database jika belum ada...';
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database.name}\``);
        
        // Tutup koneksi
        await connection.end();
        
        // Buat koneksi Sequelize setelah database ada
        spinner.text = '🔌 Menginisialisasi Sequelize...';
        sequelize = new Sequelize(
            config.database.name,
            config.database.user,
            config.database.password,
            {
                host: config.database.host,
                dialect: 'mysql',
                logging: false // Matikan logging saat inisialisasi
            }
        );

        // Coba koneksi
        spinner.text = '🔍 Mengetes koneksi database...';
        await sequelize.authenticate();
        
        spinner.succeed('✨ Database siap digunakan!');
        return sequelize;
    } catch (error) {
        spinner.fail('❌ Gagal menginisialisasi database');
        console.error('Detail error:', error);
        throw error;
    }
}

// Export fungsi inisialisasi dan instance sequelize
module.exports = {
    init: createDatabaseIfNotExists,
    getInstance: function() {
        if (!sequelize) {
            throw new Error('Database belum diinisialisasi! Panggil init() terlebih dahulu.');
        }
        return sequelize;
    }
};
