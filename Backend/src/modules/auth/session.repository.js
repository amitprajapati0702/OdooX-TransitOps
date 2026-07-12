import pool from "../../config/database.js";

export const createSession = async ({
    userId,
    jti,
    refreshTokenHash,
    ipAddress,
    userAgent,
    expiresAt
}) => {

    await pool.query(
        `
        INSERT INTO user_sessions
        (
            user_id,
            jti,
            refresh_token_hash,
            ip_address,
            user_agent,
            expires_at
        )
        VALUES($1,$2,$3,$4,$5,$6);
        `,
        [
            userId,
            jti,
            refreshTokenHash,
            ipAddress,
            userAgent,
            expiresAt
        ]
    );
};

export const findSessionByJti = async (jti) => {

    const { rows } = await pool.query(
        `
        SELECT *
        FROM user_sessions
        WHERE jti=$1
        LIMIT 1;
        `,
        [jti]
    );

    return rows[0];
};

export const revokeSession = async (jti) => {

    await pool.query(
        `
        UPDATE user_sessions
        SET revoked=TRUE
        WHERE jti=$1;
        `,
        [jti]
    );
};

export const revokeAllSessions = async (userId) => {

    await pool.query(
        `
        UPDATE user_sessions
        SET revoked=TRUE
        WHERE user_id=$1;
        `,
        [userId]
    );
};

export const deleteExpiredSessions = async () => {

    await pool.query(
        `
        DELETE
        FROM user_sessions
        WHERE expires_at < NOW();
        `
    );
};