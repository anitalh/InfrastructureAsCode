const sequelize = require("../config/db");
const {
    Sequelize
} = require("sequelize");

const User = sequelize.define("users", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        readOnly: true
    },
    username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },

    password: {
        type: Sequelize.STRING,
        allowNull: false,
        writeOnly: true
    },

    first_name: {
        type: Sequelize.STRING,
        allowNull: false,
    },

    last_name: {
        type: Sequelize.STRING,
        allowNull: false,
    },

    account_created: {
        type: Sequelize.DATE,
        allowNull: false,
        readOnly: true
    },

    account_updated: {
        type: Sequelize.DATE,
        allowNull: false,
        readOnly: true
    },
}, {
    timestamps: false
});

module.exports = User;