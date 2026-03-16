import { pool } from "../config/database";

export async function getOrdersByConsumer(consumerId: string) {

  const result = await pool.query(
    `SELECT *
     FROM orders
     WHERE consumerid = $1`,
    [consumerId]
  );

  return result.rows;

}