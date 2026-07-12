import pool from "../../config/database.js";

export const findUserByEmailAndRole = async (email, role) => {

    const query = `
        SELECT
            u.user_id,
            u.full_name,
            u.email,
            u.password_hash,
            u.is_active,
            r.role_name

        FROM users u

        INNER JOIN user_roles ur
            ON ur.user_id = u.user_id

        INNER JOIN roles r
            ON r.role_id = ur.role_id

        WHERE
            u.email = $1
            AND r.role_name = $2
    `;

    const { rows } = await pool.query(query, [email, role]);

    return rows[0];
};