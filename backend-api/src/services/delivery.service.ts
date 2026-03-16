import { pool } from "../config/database";

export async function getAvailableOrders() {
  const result = await pool.query(
    `SELECT 
       o.id,
       o.consumerid,
       o.storeid,
       o.deliveryid,
       u.name as consumername,
       s.name as storename
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
     SET deliveryid = $1
     WHERE id = $2
     RETURNING *`,
    [deliveryId, orderId]
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
       u.name as consumername,
       s.name as storename
     FROM orders o
     JOIN users u ON o.consumerid = u.id
     JOIN stores s ON o.storeid = s.id
     WHERE o.deliveryid = $1`,
    [deliveryId]
  );
  return result.rows;
}