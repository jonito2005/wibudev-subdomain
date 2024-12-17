const { DataTypes } = require('sequelize');
const { getInstance } = require('../sequelize');

const UniqueCode = getInstance().define('UniqueCode', {
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    subdomain: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true
        }
    },
    serverIP: {
        type: DataTypes.STRING,
        allowNull: false
    },
    proxyStatus: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    }
}, {
    tableName: 'UniqueCodes'
});

module.exports = UniqueCode;