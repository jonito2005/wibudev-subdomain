const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('wibudev', 'root', '', {
    host: 'localhost',
    dialect: 'mysql'
});

module.exports = sequelize;
