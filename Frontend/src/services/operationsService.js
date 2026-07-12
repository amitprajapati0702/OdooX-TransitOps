import { apiDownload, apiGet, apiPatch, apiPost } from "./api.js";

export const getDashboard = (token, query = {}) => {
	const params = new URLSearchParams(query);
	return apiGet(`/operations/dashboard${params.toString() ? `?${params.toString()}` : ""}`, token);
};

export const getAnalytics = (token, query = {}) => {
	const params = new URLSearchParams(query);
	return apiGet(`/operations/analytics${params.toString() ? `?${params.toString()}` : ""}`, token);
};

export const downloadAnalyticsCsv = (token, query = {}) => {
	const params = new URLSearchParams(query);
	return apiDownload(`/operations/analytics/export.csv${params.toString() ? `?${params.toString()}` : ""}`, token);
};

export const getVehicles = (token, query = {}) => {
	const params = new URLSearchParams(query);
	return apiGet(`/operations/vehicles${params.toString() ? `?${params.toString()}` : ""}`, token);
};
export const createVehicle = (token, body) => apiPost("/operations/vehicles", body, token);
export const updateVehicle = (token, vehicleId, body) => apiPatch(`/operations/vehicles/${vehicleId}`, body, token);

export const getDrivers = (token) => apiGet("/operations/drivers", token);
export const createDriver = (token, body) => apiPost("/operations/drivers", body, token);
export const updateDriver = (token, driverId, body) => apiPatch(`/operations/drivers/${driverId}`, body, token);

export const getTrips = (token) => apiGet("/operations/trips", token);
export const createTrip = (token, body) => apiPost("/operations/trips", body, token);
export const dispatchTrip = (token, tripId) => apiPost(`/operations/trips/${tripId}/dispatch`, {}, token);
export const completeTrip = (token, tripId, body) => apiPost(`/operations/trips/${tripId}/complete`, body, token);
export const cancelTrip = (token, tripId) => apiPost(`/operations/trips/${tripId}/cancel`, {}, token);

export const getMaintenanceRecords = (token) => apiGet("/operations/maintenance", token);
export const createMaintenance = (token, body) => apiPost("/operations/maintenance", body, token);
export const closeMaintenance = (token, maintenanceId, body = {}) => apiPost(`/operations/maintenance/${maintenanceId}/close`, body, token);

export const getFuelLogs = (token) => apiGet("/operations/fuel-logs", token);
export const createFuelLog = (token, body) => apiPost("/operations/fuel-logs", body, token);

export const getExpenses = (token) => apiGet("/operations/expenses", token);
export const createExpense = (token, body) => apiPost("/operations/expenses", body, token);

export const uploadVehicleDocument = (token, formData) => apiPost("/documents/vehicles/upload", formData, token, false);
export const getVehicleDocuments = (token, vehicleId) => apiGet(`/documents/vehicles/${vehicleId}`, token);

export const sendLicenseReminders = (token, body) => apiPost("/reminders/license-expiry/send", body, token);