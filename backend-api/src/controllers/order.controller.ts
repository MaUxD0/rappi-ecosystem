import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { getOrdersByUser, getOrderDetail as getOrderDetailService } from "../services/order.service";

export async function getMyOrders(req: AuthRequest, res: Response) {
  try {
    const consumerId = req.user.id;
    const orders = await getOrdersByUser(consumerId);
    res.json(orders);
  } catch {
    res.status(500).json({ error: "Error fetching orders" });
  }
}
export async function getOrderDetail(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const order = await getOrderDetailService(id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch {
    res.status(500).json({ error: "Error fetching order detail" });
  }
}
