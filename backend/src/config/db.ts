import mysql from 'mysql2/promise'
import { ENV } from './env'

export const db = mysql.createPool({
  host:               ENV.DB.host,
  port:               ENV.DB.port,
  database:           ENV.DB.database,
  user:               ENV.DB.user,
  password:           ENV.DB.password,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  multipleStatements: true,
})

export async function checkDbConnection(): Promise<void> {
  const conn = await db.getConnection()
  await conn.query('SELECT 1')
  conn.release()
  console.log('✅ MySQL connected via XAMPP')
}
