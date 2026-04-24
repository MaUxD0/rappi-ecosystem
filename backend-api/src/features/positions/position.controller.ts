import { Request, Response } from "express";
import { updateDeliveryPosition, markAsDelivered } from "./position.service";

export async function updatePosition(req: Request, res: Response) {
  try {
    const { orderId } = req.params;
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: "lat and lng are required" });
    }

    const cleanOrderId = Array.isArray(orderId) ? orderId[0] : orderId;
    const result = await updateDeliveryPosition(cleanOrderId, lat, lng);

    // Si el delivery llegó al destino, marcar como entregado en la BD
    if (result.arrived === true) {
      const delivered = await markAsDelivered(cleanOrderId);
      return res.json({
        id: delivered.id,
        status: delivered.status,
        arrived: true,
      });
    }

    return res.json({
      id: result.id,
      status: result.status,
      arrived: false,
    });
  } catch (error) {
    console.error("❌ Error in updatePosition:", error);
    res.status(500).json({ error: "Internal server error", details: String(error) });
  }
}
