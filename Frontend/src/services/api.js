const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

const buildHeaders = (token, isJson = true) => {
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (isJson) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
};

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("text/csv")) {
    const text = await response.text();

    if (!response.ok) {
      throw new Error(text || "Request failed");
    }

    return text;
  }

  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(payload?.message || payload || "Request failed");
  }

  return payload?.data ?? payload;
};

export const apiRequest = async (path, options = {}, token) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      ...buildHeaders(token, options.isJson ?? true),
      ...(options.headers || {}),
    },
    body: options.body,
  });

  return parseResponse(response);
};

export const apiGet = async (path, token) => apiRequest(path, { method: "GET" }, token);

export const apiPost = async (path, body, token, isJson = true) => {
  return apiRequest(
    path,
    {
      method: "POST",
      isJson,
      body: isJson ? JSON.stringify(body) : body,
    },
    token,
  );
};

export const apiPatch = async (path, body, token, isJson = true) => {
  return apiRequest(
    path,
    {
      method: "PATCH",
      isJson,
      body: isJson ? JSON.stringify(body) : body,
    },
    token,
  );
};

export const apiDownload = async (path, token) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: buildHeaders(token, false),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message || "Download failed");
  }

  return response.blob();
};