import pool from "../../config/database.js";

export const findUserByEmailAndRole = async (email, role) => {
  const query = `
        SELECT
            u.user_id,
            u.full_name,
            u.email,
            u.password_hash,
            u.is_active,
            u.is_verified,
            u.failed_login_attempts,
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

export const findUserById = async (userId) => {
  const query = `
    SELECT
      u.user_id,
      u.full_name,
      u.email,
      u.is_active,
      r.role_name
    FROM users u
    JOIN user_roles ur
      ON ur.user_id = u.user_id
    JOIN roles r
      ON r.role_id = ur.role_id
    WHERE
      u.user_id = $1
    `;

  const { rows } = await pool.query(query, [userId]);
  return rows.length ? rows[0] : null;
};

export const updatePassword = async (userId, passwordHash) => {
  await pool.query(
    `
        UPDATE users
        SET
            password_hash = $1,
            updated_at = NOW()
        WHERE user_id = $2;
        `,
    [passwordHash, userId]
  );
};

export const verifyEmail = async (userId) => {
  await pool.query(
    `
        UPDATE users
        SET
            is_verified = TRUE,
            updated_at = NOW()
        WHERE user_id = $1;
        `,
    [userId]
  );
};

export const updateLastLogin = async (userId) => {
  await pool.query(
    `
        UPDATE users
        SET
            last_login = NOW()
        WHERE user_id = $1;
        `,
    [userId]
  );
};

export const incrementFailedLoginAttempts = async (userId) => {
  await pool.query(
    `
        UPDATE users
        SET
            failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1,
            updated_at = NOW()
        WHERE user_id = $1;
        `,
    [userId]
  );
};

export const resetFailedLoginAttempts = async (userId) => {
  await pool.query(
    `
        UPDATE users
        SET
            failed_login_attempts = 0,
            updated_at = NOW()
        WHERE user_id = $1;
        `,
    [userId]
  );
};

export const lockUserAccount = async (userId) => {
  await pool.query(
    `
        UPDATE users
        SET
            is_active = FALSE,
            updated_at = NOW()
        WHERE user_id = $1;
        `,
    [userId]
  );
};
