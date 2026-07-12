import { ApiError } from "../errors/ApiError.js";

const validate = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const errors = result.error.flatten().fieldErrors;

            return next(

                new ApiError(
                    400,
                    "Validation Failed",
                    errors
                )

            );

        
        }

        req.body = result.data;
        next();
    };
};

export default validate;