const Product = require("../models/products");
const User = require("../models/users");
const authToken = require("../auth/auth")(User);
const logger = require("../config/winston");
var SDC = require('statsd-client')
const sdc = new SDC({ host: "localhost", port: 8125 });


// get existing product
exports.getProducts = async (req, res, next) => {
    try {
        sdc.increment('getProducts.get');
        const productId = req.params.id;

        logger.info(`find product by productId: ${productId}`);

        // find product by id
        const product = await Product.findByPk(productId);
        logger.info(`product displayed for requested for productId: ${productId}`);
        res.status(200).json(product);
    } catch (error) {
        logger.error(`An error occurred while processing getProducts request: ${error}`);
        next(error);
    }
};

// create new product
exports.createNewProduct = async (req, res, next) => {
    authToken(req, res, async () => {
        try {
            sdc.increment('createNewProduct.post');
            let userId = req.user.id;
            let {
                name,
                description,
                sku,
                manufacturer,
                quantity
            } = req.body;

            // check for mandatory fields
            if (!name || !description || !sku || !manufacturer) {
                logger.info(`validating request body name: ${name} ,description: ${description}, sku: ${sku}, manufacturer: ${manufacturer}`);
                return res.status(400).json({
                    message: "Missing required parameters"
                });
            }

            // check if the name, description, sku, and manufacturer are strings
            if (typeof name !== 'string' || typeof description !== 'string' || typeof sku !== 'string' || typeof manufacturer !== 'string') {
                logger.info("The name, description, sku, and manufacturer fields must be strings");
                return res.status(400).json({
                    message: "The name, description, sku, and manufacturer fields must be strings"
                });
            }

            // check if the quantity is a positive integer between 0 and 100
            if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0 || quantity > 100) {
                logger.info("quantity is not a positive integer between 0 and 100");
                return res.status(400).json({
                    message: "Quantity must be a positive integer between 0 and 100"
                });
            }

            // check if the sku exists
            const existingProduct = await Product.findOne({
                where: {
                    sku
                }
            });

            // if the SKU exists 
            if (existingProduct) {
                logger.info(`SKU ${sku} already exists`);
                return res.status(400).json({
                    message: "SKU already exists"
                });
            }

            // check for id, owner_user_id, date_added and date_last_updated cannot be set by the user
            if (req.body.id || req.body.owner_user_id || req.body.date_added || req.body.date_last_updated) {
                logger.info('id, owner_user_id, date_added and date_last_updated cannot be set by the user');
                return res.status(400).json({
                    message: 'Id, owner_user_id, date_added, and date_last_updated cannot be set',
                });
            }

            // Create a new product with the provided information and the userId from the auth token
            let product = Product.build({
                name,
                description,
                sku,
                manufacturer,
                quantity,
                date_added: new Date(),
                date_last_updated: new Date(),
                owner_user_id: userId
            });
            product = await product.save();
            logger.info("product created successfully");
            res.status(201).json({
                message: "product created"
            });
        } catch (error) {
            logger.error(`An error occurred while processing createNewProduct request: ${error}`);
            next(error);
        }
    });
};

// update products
exports.updateProduct = async (req, res, next) => {
    authToken(req, res, async () => {
        try {
            sdc.increment('updateProduct.put');
            let productId = req.params.id;
            logger.info(`productId in the request: ${productId}`);

            let userId = req.user.id;
            logger.info(`userId in the request: ${userId}`);

            // Check if the product exists
            let product = await Product.findOne({
                where: {
                    id: productId
                }
            });

            if (product) {
                // Check if the product is owned by the user who made the request
                if (product.owner_user_id !== userId) {
                    logger.info("validate userid is matching with the owner id");
                    return res.status(403).json({
                        message: "You don't have permission to update this product."
                    });
                }

                let {
                    name,
                    description,
                    sku,
                    manufacturer,
                    quantity
                } = req.body;

                // check for mandatory fields
                if (!name || !description || !sku || !manufacturer) {
                    logger.info("validate request params for updating the user");
                    return res.status(400).json({
                        message: "Missing required parameters."
                    });
                }

                // check if the name, description, sku, and manufacturer are strings
                if (typeof name !== 'string' || typeof description !== 'string' || typeof sku !== 'string' || typeof manufacturer !== 'string') {
                    logger.info("The name, description, sku, and manufacturer fields must be strings");
                    return res.status(400).json({
                        message: "The name, description, sku, and manufacturer fields must be strings"
                    });
                }

                // check if the quantity is a positive integer
                if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0 || quantity > 100) {
                    logger.info("quantity is not a positive integer");
                    return res.status(400).json({
                        message: "Quantity must be a positive integer between 0 and 100"
                    });
                }

                // Check if the updated SKU is unique
                if (product.sku !== sku) {
                    const existingProduct = await Product.findOne({
                        where: {
                            sku
                        }
                    });
                    // is sku already exists
                    if (existingProduct) {
                        logger.info(`SKU ${sku} already exists`);
                        return res.status(400).json({
                            message: "SKU already exists"
                        });
                    }
                }

                // check for id, owner_user_id, date_added and date_last_updated cannot be set by the user
                if (req.body.id || req.body.owner_user_id || req.body.date_added || req.body.date_last_updated) {
                    logger.info('id, owner_user_id, date_added and date_last_updated cannot be set by the user');
                    return res.status(400).json({
                        message: 'Id, owner_user_id, date_added, and date_last_updated cannot be set',
                    });
                }

                await product.update({
                    name,
                    description,
                    sku,
                    manufacturer,
                    quantity,
                    date_last_updated: new Date(),
                    owner_user_id: userId,
                });

                // product updated successfully.
                logger.info("product updated successfully");
                res.status(204).json();
            }
            // if the product doesn't exists
            else {
                res.status(404).json({
                    message: "Product not found"
                });
            }
        } catch (error) {
            logger.error(`An error occurred while processing updateProduct request: ${error}`);
            next(error);
        }
    });
};

// update products by fields
exports.updateProductByPatch = async (req, res, next) => {
    authToken(req, res, async () => {
        try {
            sdc.increment('updateProductByPatch.patch');
            let productId = req.params.id;
            logger.info(`productId in the request: ${productId}`);

            let userId = req.user.id;
            logger.info(`userId in the request: ${userId}`);

            // Check if the product exists
            let product = await Product.findOne({
                where: {
                    id: productId
                }
            });

            if (product) {
                // Check if the product is owned by the user who made the request
                if (product.owner_user_id !== userId) {
                    logger.info("validate userid is matching with the owner id");
                    return res.status(403).json({
                        message: "You don't have permission to update this product."
                    });
                }

                // Extracting the updated information from the request body
                let {
                    name,
                    description,
                    sku,
                    manufacturer,
                    quantity
                } = req.body;

                // If name was provided in the request body, updating the product's name
                if (name && typeof name !== "string") {
                    logger.info("name must be a string");
                    return res.status(400).json({
                        message: "Name must be a string"
                    });
                }
                if (name) {
                    product.name = name;
                }

                // If description was provided in the request body, updating the product's description
                if (description && typeof description !== "string") {
                    logger.info("description must be a string");
                    return res.status(400).json({
                        message: "Description must be a string"
                    });
                }
                if (description) {
                    product.description = description;
                }

                // If SKU was provided in the request body
                if (sku && typeof sku !== "string") {
                    logger.info("SKU must be a string");
                    return res.status(400).json({
                        message: "SKU must be a string"
                    });
                }
                if (sku) {
                    // Check if the updated SKU is unique
                    if (product.sku !== sku) {
                        const existingProduct = await Product.findOne({
                            where: {
                                sku
                            }
                        });
                        // if existing sku
                        if (existingProduct) {
                            logger.info(`SKU ${sku} already exists`);
                            return res.status(400).json({
                                message: "SKU already exists"
                            });
                        }
                    }
                    product.sku = sku;
                }

                // If manufacturer was provided in the request body, updating the product's manufacturer
                if (manufacturer && typeof manufacturer !== "string") {
                    logger.info("manufacturer must be a string");
                    return res.status(400).json({
                        message: "Manufacturer must be a string"
                    });
                }
                if (manufacturer) {
                    product.manufacturer = manufacturer;
                }

                // If quantity was provided in the request body
                if (quantity) {
                    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity <= 0 || quantity > 100) {
                        logger.info("quantity must be an integer");
                        return res.status(400).json({
                            message: "Quantity must be an positive integer between 0 and 100"
                        });
                    }

                    product.quantity = quantity;
                }

                // check for id, owner_user_id, date_added and date_last_updated cannot be set by the user
                if (req.body.id || req.body.owner_user_id || req.body.date_added || req.body.date_last_updated) {
                    logger.info('id, owner_user_id, date_added and date_last_updated cannot be set by the user');
                    return res.status(400).json({
                        message: 'Id, owner_user_id, date_added, and date_last_updated cannot be set',
                    });
                }

                product.date_last_updated = new Date();
                product.owner_user_id = userId;

                await product.save();

                // update successful
                logger.info("product updated successfully");
                res.status(204).json();
            }
            // product doesn't exist 
            else {
                res.status(404).json({
                    message: "Product not found"
                });
            }
        } catch (error) {
            logger.error(`An error occurred while processing updateProductByPatch request: ${error}`);
            next(error);
        }
    });
};

// Delete product
exports.deleteProduct = async (req, res, next) => {
    authToken(req, res, async () => {
        try {
            sdc.increment('deleteProduct.delete');
            let productId = req.params.id;

            if (!productId || productId == null) {
                logger.info("check if the productId is missing int he request");
                return res.status(400).json({
                    message: "Missing required parameter: productId."
                });
            }

            // Check if the product exists
            let product = await Product.findOne({
                where: {
                    id: productId
                }
            });

            // If product doesn't exist return error
            if (!product) {
                logger.info(`productId doesn't exist`);
                return res.status(404).json({
                    message: "Product not found"
                });
            }

            // Check if the product is owned by the user who made the request
            if (product.owner_user_id !== req.user.id) {
                logger.info(`compare owner_user_id: ${product.owner_user_id}  and userId : ${req.user.id}`);
                return res.status(403).json({
                    message: "You don't have permission to delete this product."
                });
            }

            // Delete product by id
            await product.destroy();
            logger.info(`product deleted successfully`);
            res.status(204).json();
        } catch (error) {
            logger.error(`An error occurred while processing deleteProduct request: ${error}`);
            next(error);
        }
    });
};