const sequelize = require("../config/db");
const {
    Sequelize
} = require("sequelize");

const Product = sequelize.define("products", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        readOnly: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },

    description: {
        type: Sequelize.STRING,
        allowNull: false
    },

    sku: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },

    manufacturer: {
        type: Sequelize.STRING,
        allowNull: false,
    },

    quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
            min: 0,
            max: 100
        }
    },

    date_added: {
        type: Sequelize.DATE,
        allowNull: false,
        readOnly: true
    },

    date_last_updated: {
        type: Sequelize.DATE,
        allowNull: false,
        readOnly: true
    },

    owner_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        readOnly: true
    }

}, {
    timestamps: false
});

module.exports = Product;