import { pool } from "../config/database";

export async function getStores() {
  const result = await pool.query(`SELECT * FROM stores`);
  return result.rows;
}

export async function getStoreByUserId(userId: string) {
  const result = await pool.query(
    `SELECT * FROM stores WHERE userid = $1`,
    [userId]
  );
  return result.rows[0];
}

export async function updateStoreStatus(storeId: string, isOpen: boolean) {
  const result = await pool.query(
    `UPDATE stores SET isopen = $1 WHERE id = $2 RETURNING *`,
    [isOpen, storeId]
  );
  return result.rows[0];
}

export async function getOrdersByStore(storeId: string) {
  const result = await pool.query(
    `SELECT 
       o.id as orderid,
       o.consumerid,
       o.deliveryid,
        o.status,
       p.name as productname,
       oi.quantity
     FROM orders o
     JOIN order_items oi ON o.id = oi.orderid
     JOIN products p ON p.id = oi.productid
     WHERE o.storeid = $1`,
    [storeId]
  );
  return result.rows;
}