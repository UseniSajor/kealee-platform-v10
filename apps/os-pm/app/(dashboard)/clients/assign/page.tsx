"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { api } from "@/lib/api-client"
import { toast } from "sonner"

export default function ClientAssignPage() {
  const router = useRouter()
  const qc = useQueryClient()

  const [selectedClient, setSelectedClient] = React.useState<string>("")
  const [selectedPM, setSelectedPM] = React.useState<string>("")
  const [effectiveDate, setEffectiveDate] = React.useState(() => format(new Date(), "yyyy-MM-dd"))

  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ["available-clients"],
    queryFn: () => api.getAvailableClients(),
  })

  const { data: pmsData, isLoading: pmsLoading } = useQuery({
    queryKey: ["available-pms"],
    queryFn: () => api.getAvailablePMs(),
  })

  const assignClient = useMutation({
    mutationFn: (data: { clientId: string; pmId: string; effectiveDate?: string }) =>
      api.assignClient(data.clientId, { pmId: data.pmId, effectiveDate: data.effectiveDate }),
    onSuccess: () => {
      toast.success("Client assigned successfully")
      qc.invalidateQueries({ queryKey: ["available-clients"] })
      qc.invalidateQueries({ queryKey: ["pm-clients"] })
      router.push("/clients")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to assign client")
    },
  })

  const clients = clientsData?.clients || []
  const pms = pmsData?.users || []

  const handleAssign = () => {
    if (!selectedClient || !selectedPM) {
      toast.error("Please select both a client and a PM")
      return
    }

    assignClient.mutate({
      clientId: selectedClient,
      pmId: selectedPM,
      effectiveDate,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Assign Client to PM</h1>
        <p className="text-neutral-600 mt-1">Assign unassigned clients to project managers.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Assignment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {clientsLoading || pmsLoading ? (
            <div className="text-center py-10 text-neutral-600">Loading...</div>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium">Select Client</label>
                <select
                  className="mt-1 h-10 w-full rounded-md border bg-white px-3 text-sm"
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                >
                  <option value="">Choose a client...</option>
                  {clients.map((client: any) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.activeRequests || 0} active requests)
                    </option>
                  ))}
                </select>
                {clients.length === 0 && (
                  <p className="mt-2 text-sm text-neutral-600">No unassigned clients available.</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Select PM</label>
                <select
                  className="mt-1 h-10 w-full rounded-md border bg-white px-3 text-sm"
                  value={selectedPM}
                  onChange={(e) => setSelectedPM(e.target.value)}
                >
                  <option value="">Choose a PM...</option>
                  {pms.map((pm: any) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.name} ({pm.email})
                    </option>
                  ))}
                </select>
                {pms.length === 0 && (
                  <p className="mt-2 text-sm text-neutral-600">No PMs available.</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Effective Date</label>
                <Input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAssign}
                  disabled={!selectedClient || !selectedPM || assignClient.isPending}
                >
                  {assignClient.isPending ? "Assigning..." : "Assign Client"}
                </Button>
                <Button variant="outline" onClick={() => router.push("/clients")}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
