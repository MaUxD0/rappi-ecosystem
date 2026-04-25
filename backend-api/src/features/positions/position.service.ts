import { pool } from "../../config/database";
import { OrderStatus } from "../../types/orderStatus";

export async function updateDeliveryPosition(
  orderId: string,
  lat: number,
  lng: number
) {
  // IMPORTANTE:
  // ST_MakePoint(lng, lat) — PostGIS usa (longitude, latitude)
  // ST_DWithin con ::geography mide en METROS reales
  const result = await pool.query(
    `UPDATE orders
     SET delivery_position = ST_SetSRID(ST_MakePoint($1, $2), 4326)
     WHERE id = $3
     RETURNING
       id,
       status,
       ST_DWithin(
         ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
         destination::geography,
         5
       ) AS arrived`,
    [lng, lat, orderId]  // $1=lng, $2=lat, $3=orderId
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id as string,
    status: row.status as string,
    arrived: row.arrived === true,
  };
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