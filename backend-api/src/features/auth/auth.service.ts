import { pool } from "../../config/database";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function loginUser(email: string, password: string) {

  const result = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );

  const user = result.rows[0];

  if (!user) {
    throw new Error("User not found");
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    throw new Error("Invalid password");
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      role: user.role
    }
  };
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
  role: string
) {

  const hashedPassword = await bcrypt.hash(password, 10);

  const userResult = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role`,
    [name, email, hashedPassword, role]
  );

  const user = userResult.rows[0];

 if (role === "store") {
  await pool.query(
    `INSERT INTO stores (name, userid, isopen)
     VALUES ($1, $2, false)`,
    [name + " Store", user.id]
  );
}

  return user;
}

