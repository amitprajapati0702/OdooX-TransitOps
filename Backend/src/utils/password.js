import bcrypt from "bcrypt";

export const comparePassword = async (
    plainPassword,
    hashedPassword
) => {
    return bcrypt.compare(
        plainPassword,
        hashedPassword
    );
};



