import nodemailer from "nodemailer";
import pool from "../../config/database.js";

const createTransport = () => {
  const host = process.env.SMTP_HOST;

  if (!host) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });
};

export const getExpiringDrivers = async ({ withinDays = 30 } = {}) => {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM drivers
    WHERE license_expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + ($1 || ' days')::interval
      AND status <> 'Suspended'
    ORDER BY license_expiry_date ASC;
    `,
    [withinDays],
  );

  return rows;
};

export const sendLicenseExpiryReminders = async ({ withinDays = 30 } = {}) => {
  const drivers = await getExpiringDrivers({ withinDays });
  const transport = createTransport();

  if (!transport) {
    return {
      sent: 0,
      skipped: drivers.length,
      note: "SMTP is not configured. No emails were sent.",
      drivers,
    };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  let sent = 0;

  for (const driver of drivers) {
    if (!driver.contact_number && !process.env.SMTP_FROM) {
      continue;
    }

    await transport.sendMail({
      from,
      to: process.env.REMINDER_RECIPIENT_EMAIL || from,
      subject: `TransitOps reminder: ${driver.full_name} license expires soon`,
      text: `Driver ${driver.full_name} (License: ${driver.license_number}) expires on ${driver.license_expiry_date}.`,
    });

    sent += 1;
  }

  return { sent, skipped: drivers.length - sent, drivers };
};