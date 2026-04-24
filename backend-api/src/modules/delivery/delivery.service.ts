import { pool } from "../../config/database";
import { OrderStatus } from "../../types/orderStatus";

export async function getAvailableOrders() {
  const result = await pool.query(
    `SELECT 
       o.id,
       o.consumerid,
       o.storeid,
       o.deliveryid,
       o.status,
       u.name as consumername,
       s.name as storename,
       ST_X(destination::geometry) as destination_lng,
       ST_Y(destination::geometry) as destination_lat
     FROM orders o
     JOIN users u ON o.consumerid = u.id
     JOIN stores s ON o.storeid = s.id
     WHERE o.deliveryid IS NULL`
  );
  return result.rows;
}

export async function acceptOrder(orderId: string, deliveryId: string) {
  const result = await pool.query(
    `UPDATE orders 
     SET deliveryid = $1, status = $2
     WHERE id = $3 
     RETURNING id, consumerid, storeid, deliveryid, status, 
               ST_X(destination::geometry) as destination_lng,
               ST_Y(destination::geometry) as destination_lat`,
    [deliveryId, OrderStatus.IN_DELIVERY, orderId]
  );
  return result.rows[0];
}

export async function getMyDeliveries(deliveryId: string) {
  const result = await pool.query(
    `SELECT 
       o.id,
       o.consumerid,
       o.storeid,
       o.deliveryid,
       o.status,
       u.name as consumername,
       s.name as storename,
       ST_X(destination::geometry) as destination_lng,
       ST_Y(destination::geometry) as destination_lat
     FROM orders o
     JOIN users u ON o.consumerid = u.id
     JOIN stores s ON o.storeid = s.id
     WHERE o.deliveryid = $1`,
    [deliveryId]
  );
  return result.rows;
}