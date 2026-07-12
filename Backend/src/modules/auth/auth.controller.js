import {
    login
} from "./auth.service.js";
import asyncHandler from "../../utils/asyncHandler.js"
export const loginController = asyncHandler(
    async (req, res) => {

        const result = await login(req.body);

        return res.status(200).json(result);

    }
);