import { api } from "../api/api";

export async function login(email: string, password: string) {
  const response = await api.post("/auth/login", {
    email,
    password,
  });

  return response.data;
}

export async function register(
  name: string,
  email: string,
  password: string,
  role: string
) {
  const response = await api.post("/auth/register", {
    name,
    email,
    password,
    role,
  });

  return response.data;
}