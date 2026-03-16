import { useState } from "react";
import { login } from "../services/authService";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const data = await login(email, password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "consumer") {
        window.location.href = "/stores";
      } else if (data.user.role === "store") {
        window.location.href = "/store-dashboard";
      } else if (data.user.role === "delivery") {
        window.location.href = "/delivery-dashboard";
      }
    } catch {
      alert("Login failed");
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <br />
      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />
      <button onClick={handleLogin}>Login</button>
      <p>
        ¿No tienes cuenta? <a href="/register">Regístrate</a>
      </p>
    </div>
  );
}