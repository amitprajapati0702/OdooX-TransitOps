import crypto from "crypto";
import pool from "../../config/database.js";

/**
 * Create new login session.
 */
export const createSession = async ({
    userId,
    jti,
    refreshTokenHash,
    expiresAt,
    ipAddress,
    userAgent
}) => {

    const query = `
        INSERT INTO login_audit_logs
        (
            user_id,
            refresh_token_jti,
            refresh_token_hash,
            expires_at,
            ip_address,
            user_agent,
            is_active
        )
        VALUES
        (
            $1,$2,$3,$4,$5,$6,true
        )
        RETURNING
            audit_id,
            user_id,
            refresh_token_jti,
            login_time;
    `;

    const values = [
        userId,
        jti,
        refreshTokenHash,
        expiresAt,
        ipAddress,
        userAgent
    ];

    const { rows } = await pool.query(query, values);

    return rows[0];
};

/**
 * Find active session by JWT ID.
 */
export const findSessionByJti = async (jti) => {

    const query = `
        SELECT
            audit_id,
            user_id,
            refresh_token_hash,
            expires_at,
            is_active,
            revoked_at
        FROM login_audit_logs
        WHERE refresh_token_jti = $1
        LIMIT 1;
    `;

    const { rows } = await pool.query(query, [jti]);

    return rows[0] ?? null;
};

/**
 * Revoke one session.
 */
export const revokeSession = async (jti) => {

    const query = `
        UPDATE login_audit_logs
        SET
            is_active = false,
            revoked_at = CURRENT_TIMESTAMP,
            logout_time = CURRENT_TIMESTAMP
        WHERE refresh_token_jti = $1;
    `;

    await pool.query(query, [jti]);
};

/**
 * Logout from all devices.
 */
export const revokeAllSessions = async (userId) => {

    const query = `
        UPDATE login_audit_logs
        SET
            is_active = false,
            revoked_at = CURRENT_TIMESTAMP,
            logout_time = CURRENT_TIMESTAMP
        WHERE
            user_id = $1
            AND is_active = true;
    `;

    await pool.query(query, [userId]);
};

/**
 * Remove expired sessions.
 * Can be executed daily by cron/BullMQ.
 */
export const deleteExpiredSessions = async () => {

    const query = `
        DELETE FROM login_audit_logs
        WHERE expires_at < CURRENT_TIMESTAMP;
    `;

    await pool.query(query);
};