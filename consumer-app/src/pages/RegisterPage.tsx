import { useState } from "react";
import { register } from "../services/authService";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("consumer");
  const [storeName, setStoreName] = useState("");

  const handleRegister = async () => {
    try {
      const finalName = role === "store" ? storeName : name;
      if (!finalName || !email || !password) {
        alert("Por favor llena todos los campos");
        return;
      }
      await register(finalName, email, password, role);
      alert("Usuario creado exitosamente. Por favor inicia sesión.");
      window.location.href = "/";
    } catch (error) {
      alert("Register failed");
      console.error(error);
    }
  };

  return (
    <div>
      <h1>Register</h1>

      {role !== "store" && (
        <>
          <input
            type="text"
            placeholder="Name"
            onChange={(e) => setName(e.target.value)}
          />
          <br />
        </>
      )}

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

      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="consumer">Consumer</option>
        <option value="store">Store</option>
        <option value="delivery">Delivery</option>
      </select>
      <br />

      {role === "store" && (
        <>
          <input
            type="text"
            placeholder="Store Name"
            onChange={(e) => setStoreName(e.target.value)}
          />
          <br />
        </>
      )}

      <button onClick={handleRegister}>Register</button>
      <p>
        ¿Ya tienes cuenta? <a href="/">Login</a>
      </p>
    </div>
  );
}