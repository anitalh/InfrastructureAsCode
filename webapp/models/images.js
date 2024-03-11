const sequelize = require("../config/db");
const {
    Sequelize
} = require("sequelize");
const User = require("../models/users");

const Image = sequelize.define("images", {
    image_id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        readOnly: true,
        validate: {
            notNull: true,
            notEmpty: true,
        },
    },
    product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        readOnly: true,
        validate: {
            notNull: true,
            notEmpty: true,
        },
    },
    file_name: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    date_created: {
        type: Sequelize.DATE,
        allowNull: false,
    },
    s3_bucket_path: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        readOnly: true,
        validate: {
            notNull: true,
            notEmpty: true,
        },
    },
}, {
    timestamps: false,
});

Image.belongsTo(User, {
    foreignKey: "user_id",
});

module.exports = Image;