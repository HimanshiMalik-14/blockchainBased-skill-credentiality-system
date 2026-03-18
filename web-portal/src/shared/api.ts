import axios from "axios";
import { config } from "../app/config";
import { authStorage } from "./authStorage";

export const api = axios.create({
  baseURL: config.apiBaseUrl
});

api.interceptors.request.use((req) => {
  const token = authStorage.getAccessToken();
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

