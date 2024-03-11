const express = require("express");
const imageRouter = express.Router();
const uuid = require("uuid");
const User = require("../models/users");
const Product = require("../models/products");
const Image = require("../models/images");
const authToken = require("../auth/auth")(User);
const fs = require("fs");
require('dotenv').config();
const logger = require("../config/winston");
var SDC = require('statsd-client')
const sdc = new SDC({ host: "localhost", port: 8125 });

const {
    uploadFile,
    deleteFile,
    checkFileExists
} = require("../utils/s3Helper");
const {
    v4: uuidv4
} = require('uuid');

// Upload
exports.uploadImage = async (req, res, next) => {
    authToken(req, res, async () => {
        try {
            sdc.increment('uploadImage.post');
            const file = req.file;

            const fileName = uuid.v4();
            const productId = req.params.id;

            // Fetch the product associated with the given product id
            logger.info(`finding product by id: ${productId}`);
            const product = await Product.findOne({
                where: {
                    id: productId
                }
            });

            const uploadResult = await uploadFile(file, fileName, productId);

            let image = Image.build({
                product_id: productId,
                file_name: fileName,
                s3_bucket_path: uploadResult.Location,
                date_created: new Date(),
            });
            image.user_id = req.user.id;
            image = await image.save();
            logger.info(`image created for product id: ${productId}`);
            res.status(201).json({
                message: "image created"
            });
        } catch (error) {
            logger.error(`An error occurred while processing uploadImage request: ${error}`);
            next(error);
        }
    });
};


// get product details
exports.getImageDetails = async (req, res, next) => {
    authToken(req, res, async () => {
        try {
            sdc.increment('getImageDetails.get');
            const userId = req.user.id;
            logger.info(`user id: ${userId}`);
            const productId = req.params.id;
            logger.info(`user id: ${productId}`);

            const image = await Image.findOne({
                where: {
                    product_id: productId,
                },
            });

            if (!image) {
                logger.info(`Image not found`);
                return res.status(404).json({
                    error: "Image not found",
                });
            }

            // Check if the authenticated user is the one who uploaded the image
            if (image.user_id !== userId) {
                logger.info(`Unauthorized`);
                return res.status(401).json({
                    error: "Unauthorized",
                });
            }

            const fileName = image.s3_bucket_path.split("/").pop();
            const exists = await checkFileExists(fileName, productId);
            if (!exists) {
                logger.info(`No picture found for this product and user`);
                return res.status(404).json({
                    message: "No picture found for this product and user",
                });
            }

            // Create a new object with the properties you want to include in the response
            const responseObject = {
                image_id: image.image_id,
                product_id: image.product_id,
                file_name: image.file_name,
                date_created: image.date_created,
                s3_bucket_path: image.s3_bucket_path
            };

            // Omit the user_id field from the response object
            delete responseObject.user_id;

            logger.info(`Image details displayed for image id: ${image.image_id}`);
            res.status(200).json([responseObject]);
        } catch (error) {
            logger.error(`An error occurred while processing getImageDetails request: ${error}`);
            next(error);
        }
    });
};


// get image by product and image details
exports.getProductImage = async (req, res, next) => {
    authToken(req, res, async () => {
        try {
            sdc.increment('getProductImage.get');
            const userId = req.user.id;
            logger.info(`User ID: ${userId}`);
            const productId = req.params.id;
            logger.info(`User ID: ${productId}`);

            const image = await Image.findOne({
                where: {
                    product_id: req.params.id,
                    image_id: req.params.imageId,
                },
            });

            if (!image) {
                logger.info(`Image not found for product ID ${req.params.id} and image ID ${req.params.imageId}`);
                return res.status(404).json({
                    error: "Image not found",
                });
            }

            // Check if the authenticated user is the one who uploaded the image
            if (image.user_id !== userId) {
                logger.info(`User ${userId} is not authorized to view image with ID ${req.params.imageId}`);
                return res.status(401).json({
                    error: "Unauthorized",
                });
            }

            const fileName = image.s3_bucket_path.split("/").pop();
            const exists = await checkFileExists(fileName, productId);
            if (!exists) {
                logger.info(`Image file ${fileName} does not exist`);
                return res.status(404).json({
                    message: "No picture found for this product and user",
                });
            }

            // Create a new object with the properties you want to include in the response
            const responseObject = {
                image_id: image.image_id,
                product_id: image.product_id,
                file_name: image.file_name,
                date_created: image.date_created,
                s3_bucket_path: image.s3_bucket_path
            };

            // Omit the user_id field from the response object
            delete responseObject.user_id;

            logger.info(`Returning image details for product ID ${req.params.id} and image ID ${req.params.imageId}`);
            res.status(200).json([responseObject]);
        } catch (error) {
            logger.error(`An error occurred while processing getProductImage request: ${error}`);
            next(error);
        }
    });
};

// Delete Image
exports.deleteImage = async (req, res, next) => {
    authToken(req, res, async () => {
        try {
            sdc.increment('deleteImage.delete');
            const userId = req.user.id;
            let productId = req.params.id;
            let imageId = req.params.imageId;
            logger.info(`userId: ${userId}, productId: ${productId}, imageId: ${imageId}`);

            if (!productId || productId == null || !imageId || imageId == null) {
                logger.info(`Missing required parameter: productId.`);
                return res.status(400).json({
                    message: "Missing required parameter: productId."
                });
            }

            const image = await Image.findOne({
                where: {
                    product_id: productId,
                    image_id: imageId
                },
            });

            // If product,image doesn't exist return error
            if (!image) {
                logger.info(`Product not found`);
                return res.status(404).json({
                    message: "Product not found"
                });
            }

            // Check if the authenticated user is the one who uploaded the image
            if (image.user_id !== userId) {
                logger.info(`Unauthorized`);
                return res.status(401).json({
                    error: "Unauthorized",
                });
            }

            const fileName = image.s3_bucket_path.split("/").pop();
            const exists = await deleteFile(fileName, productId);
            if (!exists) {
                logger.info(`No profile picture found for this user`);
                return res.status(404).json({
                    message: "No profile picture found for this user",
                });
            }

            // Delete image by id
            await image.destroy();
            logger.info(`Image deleted successfully`);
            res.status(204).json();
        } catch (error) {
            logger.error(`Error deleting image: ${error}`);
            next(error);
        }
    });
};
