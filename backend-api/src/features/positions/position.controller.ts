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

    const cleanOrderId = Array.isArray(orderId) ? orderId[0] : orderId;
    const result = await updateDeliveryPosition(cleanOrderId, lat, lng);

    // Crear canal de Supabase
    const channel = supabase.channel(`order:${cleanOrderId}`, {
      config: {
        broadcast: { self: true },
      },
    });

    // Suscribirse al canal
    await channel.subscribe();
    console.log("✅ Channel subscribed for order:", cleanOrderId);

    // Enviar actualización de posición
    const broadcastResponse = await channel.send({
      type: "broadcast",
      event: "position-update",
      payload: { lat, lng, status: result.status, arrived: result.arrived },
    });
    console.log("📍 Position broadcast sent:", broadcastResponse);

    // Si el delivery llegó al destino
    if (result.arrived === true) {
      console.log("🎉 Delivery arrived! Marking as delivered...");
      
      const delivered = await markAsDelivered(cleanOrderId);
      console.log("✅ Order marked as delivered:", delivered.status);

      // Enviar notificación de entrega
      const deliveryResponse = await channel.send({
        type: "broadcast",
        event: "order-delivered",
        payload: { orderId: cleanOrderId, status: delivered.status },
      });
      console.log("🔔 Delivery notification sent:", deliveryResponse);

      // Cerrar canal
      await supabase.removeChannel(channel);

      return res.json({
        id: delivered.id,
        status: delivered.status,
        arrived: true,
        message: "Order delivered successfully",
      });
    }

    // Cerrar canal
    await supabase.removeChannel(channel);
    
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
