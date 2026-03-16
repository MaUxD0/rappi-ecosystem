import { useState } from "react";
import { login } from "../services/authService";

export default function LoginPage() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {

      const data = await login(email, password);

      localStorage.setItem("token", data.token);

      window.location.href = "/stores";

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

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>
        Login
      </button>

    </div>
  );
}