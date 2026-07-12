import {
    findUserByEmailAndRole
} from "./auth.repository.js";

import {
    comparePassword
} from "../../utils/password.js";

import {
    generateAccessToken,
    generateRefreshToken
} from "../../utils/jwt.js";

export const login = async ({
    email,
    password,
    role
}) => {

    const user =
        await findUserByEmailAndRole(
            email,
            role
        );

    if (!user) {

        throw new Error(
            "Invalid email or password."
        );

    }

    if (!user.is_active) {

        throw new Error(
            "Account disabled."
        );

    }

    const matched =
        await comparePassword(
            password,
            user.password_hash
        );

    if (!matched) {

        throw new Error(
            "Invalid email or password."
        );

    }

    const payload = {

        userId: user.user_id,

        email: user.email,

        role: user.role_name

    };

    const accessToken =
        generateAccessToken(payload);

    const refreshToken =
        generateRefreshToken(payload);

    delete user.password_hash;

    return {

        success: true,

        message: "Login Successful",

        accessToken,

        refreshToken,

        user

    };

};