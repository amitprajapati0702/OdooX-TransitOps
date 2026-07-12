import { verifyAccessToken } from "../modules/auth/token.service.js";

import { findUserById } from "../modules/auth/auth.repository.js";

import { ApiError } from "../errors/ApiError.js";

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(
        401,

        "Access Token Required",
      );
    }

    const token = authHeader.split(" ")[1];

    const payload = verifyAccessToken(token);

    const user = await findUserById(payload.sub);

    if (!user) {
      throw new ApiError(
        401,

        "User Not Found",
      );
    }

    if (!user.is_active) {
      throw new ApiError(
        403,

        "Account Disabled",
      );
    }

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

export default protect;
