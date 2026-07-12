import jwt from "jsonwebtoken";

const getTokenConfig = () => {
    const {
        JWT_ACCESS_SECRET,
        JWT_REFRESH_SECRET,
        ACCESS_TOKEN_EXPIRES,
        REFRESH_TOKEN_EXPIRES
    } = process.env;

    if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
        throw new Error("JWT secrets are not configured.");
    }

    return {
        JWT_ACCESS_SECRET,
        JWT_REFRESH_SECRET,
        ACCESS_TOKEN_EXPIRES: ACCESS_TOKEN_EXPIRES || "15m",
        REFRESH_TOKEN_EXPIRES: REFRESH_TOKEN_EXPIRES || "7d"
    };
};

/**
 * Generate Access Token
 */
export const generateAccessToken = (payload) => {

    const {
        JWT_ACCESS_SECRET,
        ACCESS_TOKEN_EXPIRES
    } = getTokenConfig();

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

    const {
        JWT_REFRESH_SECRET,
        REFRESH_TOKEN_EXPIRES
    } = getTokenConfig();

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

    const { JWT_ACCESS_SECRET } = getTokenConfig();

    return jwt.verify(
        token,
        JWT_ACCESS_SECRET
    );

};

/**
 * Verify Refresh Token
 */
export const verifyRefreshToken = (token) => {

    const { JWT_REFRESH_SECRET } = getTokenConfig();

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