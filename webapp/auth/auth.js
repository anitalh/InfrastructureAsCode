module.exports = (User) => {
    const {
        getAuthPassword,
        comparePassword
    } = require("../utils/authHelper");
    const logger = require("../config/winston");

    const authToken = async (req, res, next) => {
        try {
            let authHeader = req.headers.authorization;

            // authorization header not provided in the request
            if (!authHeader) {
                logger.info("Authorization header not provided in the request");
                return res.status(401).json({
                    message: "Missing authorization header",
                });
            }

            let {
                username,
                password
            } = getAuthPassword(authHeader);

            // find the corresponding user
            let user = await User.findOne({
                where: {
                    username: username
                }
            });

            // user does not match
            if (!user) {
                logger.info("Unauthorized: Invalid username or password");
                return res.status(401).json({
                    message: "Unauthorized: Invalid username or password",
                });
            }

            // password does not match
            let isPasswordMatch = await comparePassword(password, user.password);
            if (!isPasswordMatch) {
                logger.info("Unauthorized: Invalid username or password");
                return res.status(401).json({
                    message: "Unauthorized: Invalid username or password",
                });
            }

            req.user = user;
            next();
        } catch (error) {
            next(error);
        }
    };
    return authToken;
};