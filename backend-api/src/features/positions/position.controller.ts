import { Request, Response } from "express";
import { updateDeliveryPosition, markAsDelivered } from "./position.service";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function updatePosition(req: Request, res: Response) {
  try {
    const { orderId } = req.params;
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: "lat and lng are required" });
    }

    const result = await updateDeliveryPosition(
      Array.isArray(orderId) ? orderId[0] : orderId,
      lat,
      lng
    );

    // Broadcast posición en tiempo real a consumidores
    await supabase.channel(`order:${orderId}`).send({
      type: "broadcast",
      event: "position-update",
      payload: { lat, lng, status: result.status },
    });

    // Si llegó al destino (< 5 metros), marcar como Entregado
    if (result.arrived) {
      const delivered = await markAsDelivered(
        Array.isArray(orderId) ? orderId[0] : orderId
      );

      await supabase.channel(`order:${orderId}`).send({
        type: "broadcast",
        event: "order-delivered",
        payload: { orderId, status: delivered.status },
      });

      return res.json({
        ...result,
        status: delivered.status,
        arrived: true,
      });
    }

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error updating position" });
  }
}