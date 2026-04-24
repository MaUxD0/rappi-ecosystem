import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import {
  getAvailableOrders,
  acceptOrder,
  getMyDeliveries,
  updateDeliveryPosition,
} from "../services/delivery.service";

export async function getAvailable(req: AuthRequest, res: Response) {
  try {
    const orders = await getAvailableOrders();
    res.json(orders);
  } catch {
    res.status(500).json({ error: "Error fetching available orders" });
  }
}

export async function handleAcceptOrder(req: AuthRequest, res: Response) {
  try {
    const deliveryId = req.user.id;
    const id = req.params.id as string;
    const order = await acceptOrder(id, deliveryId);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch {
    res.status(500).json({ error: "Error accepting order" });
  }
}

export async function getDeliveries(req: AuthRequest, res: Response) {
  try {
    const deliveryId = req.user.id;
    const orders = await getMyDeliveries(deliveryId);
    res.json(orders);
  } catch {
    res.status(500).json({ error: "Error fetching deliveries" });
  }
}

// ─── NUEVO: PATCH /delivery/:id/position ─────────────────────────────────────
// Recibe { lat, lng } del repartidor, actualiza la BD y responde con
// { status, arrived } para que el frontend sepa si emitir "order-delivered".
export async function updatePosition(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "lat and lng are required" });
    }

    const result = await updateDeliveryPosition(id, Number(lat), Number(lng));

    if (!result) return res.status(404).json({ error: "Order not found" });

    // Responde con status actual y si llegó al destino
    res.json({
      status: result.status,
      arrived: result.arrived === true,
    });
  } catch (err) {
    console.error("Error updating delivery position:", err);
    res.status(500).json({ error: "Error updating position" });
  }
}