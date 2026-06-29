import axios from "axios";

const api = axios.create({ baseURL: "/api", withCredentials: true });
let accessToken = sessionStorage.getItem("accessToken");
export const setAccessToken = (token) => {
  accessToken = token;
  if (token) sessionStorage.setItem("accessToken", token);
  else sessionStorage.removeItem("accessToken");
};
api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});
api.interceptors.response.use((response) => response, async (error) => {
  const original = error.config;
  if (error.response?.status === 401 && !original?._retry && !original?.url.includes("/auth/")) {
    original._retry = true;
    try {
      const { data } = await api.post("/auth/refresh");
      setAccessToken(data.data.accessToken);
      original.headers.Authorization = `Bearer ${data.data.accessToken}`;
      return api(original);
    } catch { setAccessToken(null); window.location.href = "/login"; }
  }
  return Promise.reject(error);
});
export default api;
