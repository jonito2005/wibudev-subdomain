const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const UniqueCode = sequelize.define('UniqueCode', {
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    subdomain: {
        type: DataTypes.STRING,
        allowNull: false
    },
    serverIP: {
        type: DataTypes.STRING,
        allowNull: false
    },
    proxyStatus: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    }
});

module.exports = UniqueCode;