const bcrypt = require("bcrypt");

const getAuthPassword = (authHeader) => {
    // Decode the base64 encoded string in the Authorization header
    let decodedBasicToken = Buffer.from(authHeader.split(" ")[1], "base64")
        .toString("ascii")
        .split(":");
    let username = decodedBasicToken[0];
    let password = decodedBasicToken[1];
    return {
        username,
        password
    };
};

// Function to hash a plain text password using bcrypt
const hashPasswordWithBcrypt = async (password) => {
    const salt = await bcrypt.genSalt(10);

    // Hash the password with the generated salt
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
};

// Function to compare a plain text password with a hashed password
const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

module.exports = {
    getAuthPassword,
    hashPasswordWithBcrypt,
    comparePassword
};