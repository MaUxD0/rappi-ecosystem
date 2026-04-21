import { pool } from "../../config/database";
import { OrderStatus } from "../../types/orderStatus";

export async function updateDeliveryPosition(
  orderId: string,
  lat: number,
  lng: number
) {
  const result = await pool.query(
    `UPDATE orders
     SET delivery_position = ST_SetSRID(ST_MakePoint($1, $2), 4326)
     WHERE id = $3
     RETURNING 
       id,
       status,
       ST_DWithin(
         ST_SetSRID(ST_MakePoint($1, $2), 4326),
         destination,
         5
       ) as arrived`,
    [lng, lat, orderId]
  );
  return result.rows[0];
}

export async function markAsDelivered(orderId: string) {
  const result = await pool.query(
    `UPDATE orders
     SET status = $1
     WHERE id = $2
     RETURNING *`,
    [OrderStatus.DELIVERED, orderId]
  );
  return result.rows[0];
}