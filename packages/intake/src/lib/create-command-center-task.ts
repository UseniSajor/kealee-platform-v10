export interface CreateTaskOptions {
  apiBase?: string;
}

export interface CreateTaskResult {
  ok: boolean;
  taskId?: string;
  error?: string;
}

export async function createCommandCenterTask(
  intakeId: string,
  projectPath: string,
  tags: string[],
  options: CreateTaskOptions = {},
): Promise<CreateTaskResult> {
  const base = options.apiBase ?? (typeof window !== "undefined" ? "" : "http://localhost:3001");
  const url = `${base}/api/intake/task`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intakeId, projectPath, tags }),
    });

    if (!res.ok) {
      // Non-fatal: log but don't throw
      return { ok: false, error: `HTTP ${res.status}` };
    }

    const data = (await res.json()) as { taskId?: string };
    return { ok: true, taskId: data.taskId };
  } catch (err) {
    // Non-fatal: task creation failure should not block intake
    return { ok: false, error: String(err) };
  }
}
