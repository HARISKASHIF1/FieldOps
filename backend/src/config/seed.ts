import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { db, checkDbConnection } from './db'

async function seed() {
  await checkDbConnection()
  console.log('🌱 Seeding...')

  const hash = (p: string) => bcrypt.hashSync(p, 10)

  const adminId   = uuidv4()
  const tech1Id   = uuidv4()
  const tech2Id   = uuidv4()
  const client1Id = uuidv4()
  const client2Id = uuidv4()

  await db.query(`
    INSERT IGNORE INTO users (id, name, email, password, role) VALUES
    (?, 'Admin User',       'admin@fieldops.com',  ?, 'admin'),
    (?, 'Alice Technician', 'alice@fieldops.com',  ?, 'technician'),
    (?, 'Bob Technician',   'bob@fieldops.com',    ?, 'technician'),
    (?, 'Acme Corp',        'acme@client.com',     ?, 'client'),
    (?, 'Globex Inc',       'globex@client.com',   ?, 'client')
  `, [
    adminId,   hash('admin123'),
    tech1Id,   hash('tech123'),
    tech2Id,   hash('tech123'),
    client1Id, hash('client123'),
    client2Id, hash('client123'),
  ])

  const job1Id = uuidv4()
  const job2Id = uuidv4()
  const job3Id = uuidv4()
  const job4Id = uuidv4()

  const future2 = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 19).replace('T', ' ')
  const future1 = new Date(Date.now() + 1 * 86400000).toISOString().slice(0, 19).replace('T', ' ')
  const past3   = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 19).replace('T', ' ')

  await db.query(`
    INSERT IGNORE INTO jobs (id, title, description, status, client_id, technician_id, scheduled_at, created_by) VALUES
    (?, 'HVAC Inspection',   'Annual HVAC check',               'assigned',    ?, ?, ?, ?),
    (?, 'Network Setup',     'Install office network switches',  'in_progress', ?, ?, ?, ?),
    (?, 'Printer Repair',    'Fix Canon printer paper jam',      'pending',     ?, NULL, NULL, ?),
    (?, 'Server Maintenance','Quarterly server health check',    'completed',   ?, ?, ?, ?)
  `, [
    job1Id, client1Id, tech1Id, future2, adminId,
    job2Id, client1Id, tech1Id, future1, adminId,
    job3Id, client2Id,                   adminId,
    job4Id, client2Id, tech2Id, past3,   adminId,
  ])

  // Seed some activities
  const actInsert = `INSERT IGNORE INTO job_activities (id, job_id, user_id, type, content) VALUES (?, ?, ?, 'system', ?)`
  await db.query(actInsert, [uuidv4(), job1Id, adminId, 'Job created with status: assigned'])
  await db.query(actInsert, [uuidv4(), job2Id, adminId, 'Job created with status: in_progress'])
  await db.query(actInsert, [uuidv4(), job4Id, adminId, 'Job marked as completed'])

  console.log('✅ Seed complete!')
  console.log('\n📋 Login credentials:')
  console.log('  Admin:      admin@fieldops.com  / admin123')
  console.log('  Technician: alice@fieldops.com  / tech123')
  console.log('  Client:     acme@client.com     / client123')
  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message)
  process.exit(1)
})
