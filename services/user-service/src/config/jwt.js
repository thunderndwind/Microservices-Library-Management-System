const jwt = require("jsonwebtoken");

const JWT_SECRET =
    process.env.JWT_SECRET ||
    "your_super_secret_jwt_key_for_users_change_in_production";
const JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET ||
    "your_super_secret_refresh_key_for_users_change_in_production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

const generateTokens = (payload) => {
    const accessToken = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
    });

    return { accessToken, refreshToken };
};

const verifyAccessToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};

const verifyRefreshToken = (token) => {
    return jwt.verify(token, JWT_REFRESH_SECRET);
};

module.exports = {
    generateTokens,
    verifyAccessToken,
    verifyRefreshToken,
    JWT_SECRET,
    JWT_REFRESH_SECRET,
};
