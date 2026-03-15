import { Request, Response } from "express";
import { registerUser } from "./auth.service";
import { loginUser } from "./auth.service";

export async function login(req: Request, res: Response) {

  try {

    const { email, password } = req.body;

    const result = await loginUser(email, password);

    res.json(result);

  } catch (error) {
  console.log(error);
  res.status(401).json({ error: (error as Error).message });
}
}

export async function register(req: Request, res: Response) {

  try {

    const { name, email, password, role } = req.body;

    const user = await registerUser(name, email, password, role);

    res.json(user);

  } catch (error) {

    res.status(500).json({ error: "Error creating user" });

  }

}