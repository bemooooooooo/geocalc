const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
const TOKEN_KEY = "geocalc_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 204) {
    return null;
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || "Ошибка запроса");
  }
  return data;
}

export async function register(username, password) {
  const data = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setToken(data.token);
  return data.user;
}

export async function login(username, password) {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setToken(data.token);
  return data.user;
}

export async function fetchCurrentUser() {
  return request("/auth/me");
}

export async function fetchShapes() {
  return request("/shapes");
}

export async function calculate(shape, params) {
  return request("/calculate", {
    method: "POST",
    body: JSON.stringify({ shape, params }),
  });
}

export async function fetchHistory() {
  return request("/history");
}

export async function deleteHistory(id) {
  return request(`/history/${id}`, { method: "DELETE" });
}
