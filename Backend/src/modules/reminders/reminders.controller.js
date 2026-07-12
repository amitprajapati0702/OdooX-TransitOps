import asyncHandler from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { getExpiringDrivers, sendLicenseExpiryReminders } from "./reminders.service.js";

export const listExpiringDriversController = asyncHandler(async (req, res) => {
  const withinDays = Number(req.query.withinDays || 30);
  const drivers = await getExpiringDrivers({ withinDays });

  return res.status(200).json(new ApiResponse(200, "Expiring drivers fetched successfully.", drivers));
});

export const sendLicenseRemindersController = asyncHandler(async (req, res) => {
  const withinDays = Number(req.body.withinDays || 30);
  const result = await sendLicenseExpiryReminders({ withinDays });

  return res.status(200).json(new ApiResponse(200, "License reminder job completed.", result));
});