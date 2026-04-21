import { Request, Response } from "express";
import {
  getAvailableOrders,
  acceptOrder,
  getMyDeliveries,
} from "./delivery.service";

export async function availableOrders(req: Request, res: Response) {
  try {
    const orders = await getAvailableOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Error fetching available orders" });
  }
}

export async function accept(req: Request, res: Response) {
  try {
    const { orderId } = req.body;
    const deliveryId = (req as any).user.id;
    const order = await acceptOrder(orderId, deliveryId);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Error accepting order" });
  }
}

export async function myDeliveries(req: Request, res: Response) {
  try {
    const deliveryId = (req as any).user.id;
    const orders = await getMyDeliveries(deliveryId);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Error fetching deliveries" });
  }
}