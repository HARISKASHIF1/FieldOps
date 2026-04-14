import { db, checkDbConnection } from './db'

async function migrate() {
  await checkDbConnection()
  console.log('🔄 Running migrations...')

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         VARCHAR(36)  PRIMARY KEY,
      name       VARCHAR(255) NOT NULL,
      email      VARCHAR(255) NOT NULL UNIQUE,
      password   VARCHAR(255) NOT NULL,
      role       ENUM('admin','technician','client') NOT NULL,
      is_active  TINYINT(1)   NOT NULL DEFAULT 1,
      created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id         VARCHAR(36)  PRIMARY KEY,
      user_id    VARCHAR(36)  NOT NULL,
      token      TEXT         NOT NULL,
      expires_at DATETIME     NOT NULL,
      created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id            VARCHAR(36)  PRIMARY KEY,
      title         VARCHAR(255) NOT NULL,
      description   TEXT,
      status        ENUM('pending','assigned','in_progress','on_hold','completed','cancelled') NOT NULL DEFAULT 'pending',
      client_id     VARCHAR(36)  NOT NULL,
      technician_id VARCHAR(36),
      scheduled_at  DATETIME,
      completed_at  DATETIME,
      created_by    VARCHAR(36)  NOT NULL,
      created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at    DATETIME,
      FOREIGN KEY (client_id)     REFERENCES users(id),
      FOREIGN KEY (technician_id) REFERENCES users(id),
      FOREIGN KEY (created_by)    REFERENCES users(id)
    );
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS job_activities (
      id         VARCHAR(36) PRIMARY KEY,
      job_id     VARCHAR(36) NOT NULL,
      user_id    VARCHAR(36) NOT NULL,
      type       ENUM('note','status_change','assignment','system') NOT NULL,
      content    TEXT        NOT NULL,
      metadata   JSON,
      created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id)  REFERENCES jobs(id)  ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id         VARCHAR(36)  PRIMARY KEY,
      user_id    VARCHAR(36)  NOT NULL,
      job_id     VARCHAR(36),
      type       VARCHAR(50)  NOT NULL,
      title      VARCHAR(255) NOT NULL,
      message    TEXT         NOT NULL,
      is_read    TINYINT(1)   NOT NULL DEFAULT 0,
      created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (job_id)  REFERENCES jobs(id)  ON DELETE SET NULL
    );
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id         VARCHAR(36)  PRIMARY KEY,
      user_id    VARCHAR(36),
      action     VARCHAR(100) NOT NULL,
      entity     VARCHAR(50)  NOT NULL,
      entity_id  VARCHAR(36),
      changes    JSON,
      ip_address VARCHAR(45),
      created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `)

  // Indexes
  await db.query(`CREATE INDEX IF NOT EXISTS idx_jobs_client     ON jobs(client_id);`).catch(() => {})
  await db.query(`CREATE INDEX IF NOT EXISTS idx_jobs_tech       ON jobs(technician_id);`).catch(() => {})
  await db.query(`CREATE INDEX IF NOT EXISTS idx_jobs_status     ON jobs(status);`).catch(() => {})
  await db.query(`CREATE INDEX IF NOT EXISTS idx_jobs_deleted    ON jobs(deleted_at);`).catch(() => {})
  await db.query(`CREATE INDEX IF NOT EXISTS idx_activities_job  ON job_activities(job_id);`).catch(() => {})
  await db.query(`CREATE INDEX IF NOT EXISTS idx_notif_user      ON notifications(user_id, is_read);`).catch(() => {})

  console.log('✅ Migration complete')
  process.exit(0)
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err.message)
  process.exit(1)
})
