import { Request, Response } from "express";
import { updateDeliveryPosition, markAsDelivered } from "./position.service";

export async function updatePosition(req: Request, res: Response) {
  try {
    const { orderId } = req.params;
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "lat and lng are required" });
    }

    const cleanOrderId = Array.isArray(orderId) ? orderId[0] : orderId;

    const result = await updateDeliveryPosition(
      cleanOrderId,
      Number(lat),
      Number(lng)
    );

    if (!result) {
      return res.status(404).json({ error: "Order not found" });
    }

    console.log(`📍 Position update for order ${cleanOrderId}: lat=${lat}, lng=${lng}, arrived=${result.arrived}`);

    if (result.arrived === true) {
      const delivered = await markAsDelivered(cleanOrderId);
      console.log(`✅ Order ${cleanOrderId} marked as delivered`);
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
    res.status(500).json({
      error: "Internal server error",
      details: String(error),
    });
  }
}
