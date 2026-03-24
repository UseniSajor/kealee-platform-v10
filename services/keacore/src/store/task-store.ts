import { Task } from "@kealee/core-agents";
import { createId } from "@kealee/core-agents";

// TODO: replace with DB-backed persistence (Prisma)
const store = new Map<string, Task>();

export const taskStore = {
  create(params: Omit<Task, "id" | "createdAt" | "updatedAt">): Task {
    const now = new Date().toISOString();
    const task: Task = {
      ...params,
      id: createId("task"),
      createdAt: now,
      updatedAt: now,
    };
    store.set(task.id, task);
    return task;
  },

  get(id: string): Task {
    const task = store.get(id);
    if (!task) throw new Error(`Task not found: ${id}`);
    return task;
  },

  update(id: string, patch: Partial<Task>): Task {
    const task = this.get(id);
    const updated = { ...task, ...patch, updatedAt: new Date().toISOString() };
    store.set(id, updated);
    return updated;
  },

  list(sessionId?: string): Task[] {
    const all = Array.from(store.values());
    return sessionId ? all.filter((t) => t.sessionId === sessionId) : all;
  },
};
