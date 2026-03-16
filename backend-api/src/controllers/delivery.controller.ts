import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { getAvailableOrders } from "../services/delivery.service";
export async function getAvailable(req: AuthRequest, res: Response) {

  try {

    const orders = await getAvailableOrders();

    res.json(orders);

  } catch (error) {

    res.status(500).json({
      error: "Error fetching available orders"
    });

  }

}