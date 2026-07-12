import asyncHandler from "../../utils/asyncHandler.js";

import { login } from "./auth.service.js";

import { ApiResponse } from "../../utils/apiResponse.js";

export const loginController = asyncHandler(

    async(req,res)=>{

        const result = await login(req.body);

        return res.status(200).json(

            new ApiResponse(

                200,

                "Login Successful",

                result

            )

        );

    }

);