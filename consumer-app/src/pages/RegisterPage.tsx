import { useState } from "react";
import { register } from "../services/authService";

export default function RegisterPage() {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("consumer");

  const handleRegister = async () => {

    try {

      await register(name, email, password, role);

      alert("User created successfully");

    } catch (error) {

      alert("Register failed");
      console.error("Register error:", error);

    }

  };

  return (
    <div>

      <h1>Register</h1>

      <input
        type="text"
        placeholder="Name"
        onChange={(e) => setName(e.target.value)}
      />

      <br />

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

      <select onChange={(e) => setRole(e.target.value)}>

        <option value="consumer">Consumer</option>

        <option value="store">Store</option>

        <option value="delivery">Delivery</option>

      </select>

      <br />

      <button onClick={handleRegister}>
        Register
      </button>

    </div>
  );

}