const User = require("../models/users");
const authToken = require("../auth/auth")(User);
const {
    hashPasswordWithBcrypt
} = require("../utils/authHelper");
const logger = require("../config/winston");
var SDC = require('statsd-client')
const sdc = new SDC({ host: "localhost", port: 8125 });


// check the format of an email address
const emailVerification = (username) => {
    logger.info("verifying email format");
    return String(username)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
};

// Get User
exports.getUserDetails = async (req, res, next) => {
    authToken(req, res, async () => {
        try {
            sdc.increment('getUserDetails.get');
            id = req.params.id;
            logger.info(`finding user by id: ${id}`);

            // Find the user by ID
            const user = await User.findByPk(id);

            // Check if the user exists
            if (!user) {
                logger.info(`User not found for id: ${id}`);
                return res.status(403).json({
                    message: "you don't have permission to access the details",
                });
            }

            // Check if the user is authorized to access their own details
            if (req.user.id !== user.id) {
                logger.info(`Unauthorized access attempted for user id: ${id}`);
                return res.status(401).json({
                    message: "You are not authorized to access this information",
                });
            }

            // Return the user details
            logger.info(`User details displayed for id: ${id}`);
            res.status(200).json({
                id: user.id,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                account_created: user.account_created,
                account_updated: user.account_updated,
            });
        } catch (error) {
            logger.error(`An error occurred while processing getUserDetails request: ${error}`);
            next(error);
        }
    });
};


// create a new user
exports.createNewUser = async (req, res, next) => {
    try {
        sdc.increment('createNewUser.post');
        let {
            first_name,
            last_name,
            username,
            password
        } = req.body;
        logger.info(`Received request to create a new user with username: ${username}`);

        // Check if all required fields are provided
        if (!first_name || !last_name || !username || !password) {
            logger.info("check all the required fields are passed in the request");
            return res.status(400).json({
                message: "Missing required fields"
            });
        }

        // Check if the email format is valid
        if (!emailVerification(username)) {
            logger.info("verify email");
            return res.status(400).json({
                message: "Invalid email format"
            });
        }

        // Check if the username already exists
        let existingUser = await User.findOne({
            where: {
                username: username
            }
        });

        // if existingUser, cannot be created
        if (existingUser) {
            logger.info("if existing user throw error");
            return res.status(400).json({
                message: "Username already exists"
            });
        }

        let hashedPassword = await hashPasswordWithBcrypt(req.body.password);

        // Create a new user with the provided information
        let user = User.build({
            username: req.body.username,
            password: hashedPassword,
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            account_created: new Date(),
            account_updated: new Date(),
        });
        user = await user.save();
        logger.info("user saved successfully");
        res.status(201).json({
            message: "User created"
        });
    } catch (error) {
        logger.error(`An error occurred while processing createNewUser request: ${error}`);
        next(error);
    }
};

// Update existing User
exports.updateUser = async (req, res, next) => {
    authToken(req, res, async () => {
        try {
            sdc.increment('updateUser.put');
            let id = req.params.id;
            logger.info(`Finding user by id: ${id}`);

            // Check if the user exists
            const user = await User.findByPk(id);
            if (!user) {
                logger.info(`User not found with id: ${id}`);
                return res.status(403).json({
                    message: 'you dont have permission to access the details',
                });
            }

            // Check if the authenticated user is the same as the user being updated
            if (req.user.id !== parseInt(id)) {
                logger.info(`User with id ${req.user.id} is not authorized to update user with id: ${id}`);
                return res.status(403).json({
                    message: "You don't have permission to update other users' information",
                });
            }

            logger.info(`Updating user with id: ${id}`);

            if (req.body.id || req.body.username || req.body.account_created || req.body.account_updated) {
                logger.info(`Cannot update id, username, account_created, and account_updated for user with id: ${id}`);
                return res.status(400).json({
                    message: 'Id, username, account_created, and account_updated cannot be set',
                });
            }

            let {
                first_name,
                last_name,
                password
            } = req.body;

            if (password) {
                let hashedPassword = await hashPasswordWithBcrypt(password);
                await User.update({
                    first_name,
                    last_name,
                    password: hashedPassword
                }, {
                    where: {
                        id: id
                    }
                });
            } else {
                await User.update({
                    first_name,
                    last_name
                }, {
                    where: {
                        id: id
                    }
                });
            }

            logger.info(`User with id ${id} updated successfully`);
            res.status(204).json();

        } catch (error) {
            logger.error(`An error occurred while processing updateUser request: ${error}`);
            next(error);
        }
    });
}
