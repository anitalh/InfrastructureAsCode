const AWS = require('aws-sdk');
const config = require('../config/config');
const fs = require('fs');
const logger = require("../config/winston");
require('dotenv').config();

AWS.config.update({
    region: process.env.AWS_REGION,
});


const s3 = new AWS.S3();

// upload file to s3
exports.uploadFile = async (file, fileName, productId) => {
    try {
        const fileStream = fs.createReadStream(file.path);

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Body: fileStream,
            Key: `${productId}/${fileName}`
        };

        return new Promise((resolve, reject) => {
            s3.upload(params, (err, data) => {
                if (err) {
                    logger.info(`Failed to upload file to s3. Error: ${err}`);
                    reject(err);
                } else {
                    logger.info(`File uploaded successfully to s3`);
                    resolve(data);
                }
            });
        });
    } catch (err) {
        logger.error(`Failed to upload file to s3. Error: ${err}`);
        throw err;
    }
};

// delete file from s3
exports.deleteFile = async (fileName, productId) => {
    try {
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `${productId}/${fileName}`
        };

        return new Promise((resolve, reject) => {
            s3.deleteObject(params, (err, data) => {
                if (err) {
                    logger.info(`Failed to delete file from s3. Error: ${err}`);
                    reject(err);
                } else {
                    logger.info(`File deleted successfully from s3`);
                    resolve(data);
                }
            });
        });
    } catch (err) {
        logger.error(`Failed to delete file from s3. Error: ${err}`);
        throw err;
    }
};

// check if the file exists in s3
exports.checkFileExists = async (fileName, productId) => {
    try {
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `${productId}/${fileName}`
        };

        return new Promise((resolve, reject) => {
            s3.headObject(params, (err, data) => {
                if (err) {
                    if (err.code === 'NotFound') {
                        resolve(false); // file doesn't exist
                    } else {
                        logger.info(`Failed to check if file exists in s3. Error: ${err}`);
                        reject(err);
                    }
                } else {
                    logger.info(`File exists in s3`);
                    resolve(true); // file exists
                }
            });
        });
    } catch (err) {
        logger.error(`Failed to check if file exists in s3. Error: ${err}`);
        throw err;
    }
};