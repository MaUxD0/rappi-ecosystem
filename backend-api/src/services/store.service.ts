import { pool } from "../config/database";

export async function getStores() {

  const result = await pool.query(
    `SELECT * FROM stores`
  );

  return result.rows;

}