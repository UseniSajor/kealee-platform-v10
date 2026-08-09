import { getHealthStatus, getMetricsByTask } from './monitoring'
import { getQueueStats, getJobHistory } from './job-queue'

export interface DashboardData {
  timestamp: string
  health: ReturnType<typeof getHealthStatus>
  queueStats: Record<string, any>
  taskDetails: Array<{
    name: string
    stats: any
    recentJobs: any[]
  }>
}

export async function getDashboardData(): Promise<DashboardData> {
  const health = getHealthStatus()
  const queueStats = await getQueueStats()

  const taskDetails = await Promise.all(
    health.tasks.map(async task => ({
      name: task.name,
      stats: task,
      recentJobs: await getJobHistory(task.name, 5),
    }))
  )

  return {
    timestamp: new Date().toISOString(),
    health,
    queueStats,
    taskDetails,
  }
}

export function formatDashboardHTML(data: DashboardData): string {
  const successRate = data.health.successRate.toFixed(1)
  const statusColor = data.health.status === 'healthy' ? '#22c55e' : '#f59e0b'

  let taskRows = ''
  for (const task of data.taskDetails) {
    const lastRunTime = task.stats.lastRun ? new Date(task.stats.lastRun).toLocaleString() : 'Never'
    const rate = task.stats.totalRuns > 0
      ? ((task.stats.successCount / task.stats.totalRuns) * 100).toFixed(0)
      : 'N/A'

    const statusIcon = task.stats.lastStatus === 'success' ? '✅' : '❌'
    taskRows += `
      <tr>
        <td style="border-bottom: 1px solid #eee; padding: 12px;">${statusIcon} ${task.stats.name}</td>
        <td style="border-bottom: 1px solid #eee; padding: 12px;">${task.stats.schedule}</td>
        <td style="border-bottom: 1px solid #eee; padding: 12px; text-align: center;">${lastRunTime}</td>
        <td style="border-bottom: 1px solid #eee; padding: 12px; text-align: center;">${task.stats.totalRuns}</td>
        <td style="border-bottom: 1px solid #eee; padding: 12px; text-align: center;">${rate}%</td>
        <td style="border-bottom: 1px solid #eee; padding: 12px; text-align: center;">${task.stats.averageRuntime.toFixed(0)}ms</td>
      </tr>
    `
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Kealee Marketing Cron Dashboard</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          background: #f9fafb;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        h1 {
          margin-top: 0;
          color: #111827;
        }
        .status-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          border-left: 4px solid ${statusColor};
        }
        .status-badge {
          display: inline-block;
          background: ${statusColor};
          color: white;
          padding: 4px 12px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 14px;
        }
        .metric {
          display: inline-block;
          margin-right: 30px;
          margin-top: 10px;
        }
        .metric-label {
          color: #6b7280;
          font-size: 12px;
          text-transform: uppercase;
        }
        .metric-value {
          font-size: 24px;
          font-weight: bold;
          color: #111827;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        th {
          background: #f3f4f6;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
        }
        .timestamp {
          color: #9ca3af;
          font-size: 12px;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📊 Marketing Cron Dashboard</h1>

        <div class="status-card">
          <div style="display: flex; align-items: center; gap: 15px;">
            <div>
              <span class="status-badge">${data.health.status.toUpperCase()}</span>
            </div>
            <div style="flex: 1;">
              <div class="metric">
                <div class="metric-label">Active Tasks</div>
                <div class="metric-value">${data.health.activeTasks}</div>
              </div>
              <div class="metric">
                <div class="metric-label">Success Rate</div>
                <div class="metric-value">${successRate}%</div>
              </div>
              <div class="metric">
                <div class="metric-label">Total Executions</div>
                <div class="metric-value">${data.health.totalRuns}</div>
              </div>
              <div class="metric">
                <div class="metric-label">Failed</div>
                <div class="metric-value" style="color: #ef4444;">${data.health.totalFailures}</div>
              </div>
            </div>
          </div>
          <div class="timestamp">Last updated: ${new Date(data.timestamp).toLocaleString()}</div>
        </div>

        <h2 style="margin-top: 30px; color: #111827;">Task Execution History</h2>
        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Schedule</th>
              <th>Last Run</th>
              <th>Total Runs</th>
              <th>Success Rate</th>
              <th>Avg Runtime</th>
            </tr>
          </thead>
          <tbody>
            ${taskRows}
          </tbody>
        </table>

        <div style="margin-top: 30px; padding: 15px; background: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
          <strong>💡 About this dashboard:</strong><br>
          • Tasks run on the schedule shown (UTC times)<br>
          • Success rate = successful executions / total executions<br>
          • Avg Runtime = average milliseconds per execution<br>
          • Status: Healthy if all tasks run without errors; Degraded if any failed
        </div>
      </div>
    </body>
    </html>
  `
}
