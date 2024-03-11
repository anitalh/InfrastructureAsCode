const {
    Sequelize
} = require("sequelize");
const config = require("../config/config");
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USERNAME,
    process.env.DB_PASSWORD, {
        host: process.env.DB_HOST,
        dialect: "mysql",
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    });

sequelize.connect = async () => {
    await sequelize.authenticate();
    console.log("Database connected successfully!!");
    await sequelize.sync();
    console.log("Sync done..!!");
};

sequelize.disconnect = async () => {
    await sequelize.close();
    console.log("Database disconnected successfully!");
};

module.exports = sequelize;