import { login } from "./auth.service.js";

export const loginController = async (req, res, next) => {

    try {

        const result = await login(req.body);

        return res.status(200).json(result);

    }

    catch (error) {

        next(error);

    }

};