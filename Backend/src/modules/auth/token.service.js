import jwt from "jsonwebtoken";

const {
    JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET,
    ACCESS_TOKEN_EXPIRES,
    REFRESH_TOKEN_EXPIRES
} = process.env;

/**
 * Generate Access Token
 */
export const generateAccessToken = (payload) => {

    return jwt.sign(
        payload,
        JWT_ACCESS_SECRET,
        {
            expiresIn: ACCESS_TOKEN_EXPIRES
        }
    );

};

/**
 * Generate Refresh Token
 */
export const generateRefreshToken = (payload) => {

    return jwt.sign(
        payload,
        JWT_REFRESH_SECRET,
        {
            expiresIn: REFRESH_TOKEN_EXPIRES
        }
    );

};

/**
 * Verify Access Token
 */
export const verifyAccessToken = (token) => {

    return jwt.verify(
        token,
        JWT_ACCESS_SECRET
    );

};

/**
 * Verify Refresh Token
 */
export const verifyRefreshToken = (token) => {

    return jwt.verify(
        token,
        JWT_REFRESH_SECRET
    );

};

/**
 * Decode Token
 *
 * Does NOT verify signature.
 * Useful only for debugging.
 */
export const decodeToken = (token) => {

    return jwt.decode(token);

};