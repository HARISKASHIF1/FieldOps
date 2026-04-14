import { Request, Response, NextFunction } from 'express'
import { db } from '../config/db'

export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const [jobStatsResult, userStatsResult, recentJobsResult, recentActivityResult] = await Promise.all([
      // Job counts by status
      db.query(`
        SELECT status, COUNT(*) as count
        FROM jobs WHERE deleted_at IS NULL
        GROUP BY status
      `),
      // User counts by role
      db.query(`
        SELECT role, COUNT(*) as count
        FROM users WHERE is_active = true
        GROUP BY role
      `),
      // Recent 5 jobs
      db.query(`
        SELECT j.id, j.title, j.status, j.created_at,
               c.name AS client_name, t.name AS technician_name
        FROM jobs j
        LEFT JOIN users c ON c.id = j.client_id
        LEFT JOIN users t ON t.id = j.technician_id
        WHERE j.deleted_at IS NULL
        ORDER BY j.created_at DESC
        LIMIT 5
      `),
      // Recent activity
      db.query(`
        SELECT a.content, a.type, a.created_at,
               u.name AS user_name, j.title AS job_title
        FROM job_activities a
        JOIN users u ON u.id = a.user_id
        JOIN jobs j ON j.id = a.job_id
        ORDER BY a.created_at DESC
        LIMIT 10
      `),
    ])

    const [jobStats] = jobStatsResult
    const [userStats] = userStatsResult
    const [recentJobs] = recentJobsResult
    const [recentActivity] = recentActivityResult

    const jobStatusMap = Object.fromEntries(
      jobStats.map((r: any) => [r.status, parseInt(r.count)])
    )
    const userRoleMap = Object.fromEntries(
      userStats.map((r: any) => [r.role, parseInt(r.count)])
    )

    res.json({
      success: true,
      data: {
        jobs: {
          total: Object.values(jobStatusMap).reduce((a: number, b) => a + (b as number), 0),
          by_status: jobStatusMap,
        },
        users: userRoleMap,
        recent_jobs: recentJobs,
        recent_activity: recentActivity,
      },
    })
  } catch (err) {
    next(err)
  }
}