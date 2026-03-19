"use server";

const API_BASE =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001";

export interface ConceptQueueItem {
  id: string;
  packageName: string;
  packageTier: string;
  deliveryStatus: string;
  status: string;
  createdAt: string;
  user?: { name?: string; email?: string };
  metadata?: Record<string, unknown>;
}

export interface ConceptQueueResult {
  orders: ConceptQueueItem[];
  total: number;
}

export async function loadConceptQueue(params?: {
  deliveryStatus?: string;
  limit?: number;
}): Promise<ConceptQueueResult> {
  try {
    const qs = new URLSearchParams();
    if (params?.deliveryStatus) qs.set("deliveryStatus", params.deliveryStatus);
    qs.set("limit", String(params?.limit ?? 50));

    const res = await fetch(`${API_BASE}/api/v1/concepts/queue?${qs}`, {
      cache: "no-store",
      headers: { "x-internal-service": "command-center" },
    });

    if (!res.ok) return { orders: [], total: 0 };
    return res.json();
  } catch {
    return { orders: [], total: 0 };
  }
}

export async function loadConceptOrderDetail(id: string) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/concepts/queue/${id}`, {
      cache: "no-store",
      headers: { "x-internal-service": "command-center" },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function updateDeliveryStatus(
  id: string,
  deliveryStatus: string,
  deliveryUrl?: string,
) {
  const res = await fetch(
    `${API_BASE}/api/v1/concepts/queue/${id}/delivery-status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-internal-service": "command-center",
      },
      body: JSON.stringify({ deliveryStatus, deliveryUrl }),
    },
  );
  if (!res.ok) throw new Error("Failed to update delivery status");
  return res.json();
}
