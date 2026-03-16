import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { getOrdersByConsumer } from "../services/order.service";

export async function getMyOrders(req: AuthRequest, res: Response) {

  try {

    const consumerId = req.user.id;

    const orders = await getOrdersByConsumer(consumerId);

    res.json(orders);

  } catch (error) {

    res.status(500).json({
      error: "Error fetching orders"
    });

  }

}