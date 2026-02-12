"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from "./supabase"

// ── Role Definitions ──────────────────────────────────────────────

export type UserRole =
  | "pm"
  | "pm_supervisor"
  | "admin"
  | "super_admin"
  | "contractor"
  | "gc"
  | "builder"
  | "architect"
  | "engineer"
  | "owner"
  | "client"
  | "user"

export type SubscriptionTier = "essentials" | "performance" | "scale" | "enterprise" | "none"

const INTERNAL_ROLES: UserRole[] = ["pm", "pm_supervisor", "admin", "super_admin"]
const EXTERNAL_ROLES: UserRole[] = ["contractor", "gc", "builder", "architect", "engineer", "owner", "client"]

// ── Permissions ───────────────────────────────────────────────────

export interface RolePermissions {
  // Internal PM tools
  canAccessWorkQueue: boolean
  canAccessPipeline: boolean
  canAccessClientManagement: boolean
  canAccessAutonomousActions: boolean
  canAccessContractorRankings: boolean
  canAccessContractorPayments: boolean
  canAccessServiceDelivery: boolean
  // PM Software features (tiered)
  canAccessProjects: boolean
  canAccessSchedule: boolean
  canAccessBudget: boolean
  canAccessDocuments: boolean
  canAccessPhotos: boolean
  canAccessTasks: boolean
  canAccessReports: boolean
  canAccessCommunication: boolean
  canAccessTeam: boolean
  // Field tools
  canAccessDailyLogs: boolean
  canAccessInspections: boolean
  canAccessSafety: boolean
  canAccessPunchList: boolean
  // Business tools
  canAccessBids: boolean
  canAccessContracts: boolean
  canAccessChangeOrders: boolean
  canAccessRFIs: boolean
  canAccessSubmittals: boolean
  canAccessDrawings: boolean
  canAccessSelections: boolean
  canAccessWarranty: boolean
  canAccessMeetings: boolean
  // Analytics
  canAccessAnalytics: boolean
  canAccessFieldStatus: boolean
}

function getPermissions(role: UserRole, tier: SubscriptionTier): RolePermissions {
  const isInternal = INTERNAL_ROLES.includes(role)

  // Internal users get everything
  if (isInternal) {
    return Object.fromEntries(
      Object.keys(DEFAULT_PERMISSIONS).map((k) => [k, true])
    ) as RolePermissions
  }

  // Base permissions for all external users
  const base: RolePermissions = {
    ...DEFAULT_PERMISSIONS,
    canAccessProjects: true,
    canAccessTasks: true,
    canAccessDocuments: true,
    canAccessPhotos: true,
    canAccessCommunication: true,
    canAccessTeam: true,
    canAccessDailyLogs: true,
    canAccessReports: true,
  }

  // Tier-based upgrades
  if (tier === "performance" || tier === "scale" || tier === "enterprise") {
    base.canAccessSchedule = true
    base.canAccessBudget = true
    base.canAccessRFIs = true
    base.canAccessSubmittals = true
    base.canAccessChangeOrders = true
    base.canAccessPunchList = true
    base.canAccessBids = true
    base.canAccessContracts = true
    base.canAccessInspections = true
  }

  if (tier === "scale" || tier === "enterprise") {
    base.canAccessSafety = true
    base.canAccessDrawings = true
    base.canAccessSelections = true
    base.canAccessMeetings = true
    base.canAccessAnalytics = true
    base.canAccessFieldStatus = true
    base.canAccessWarranty = true
  }

  if (tier === "enterprise") {
    // Enterprise gets all features
    return Object.fromEntries(
      Object.keys(base).map((k) => [k, true])
    ) as RolePermissions
  }

  return base
}

const DEFAULT_PERMISSIONS: RolePermissions = {
  canAccessWorkQueue: false,
  canAccessPipeline: false,
  canAccessClientManagement: false,
  canAccessAutonomousActions: false,
  canAccessContractorRankings: false,
  canAccessContractorPayments: false,
  canAccessServiceDelivery: false,
  canAccessProjects: false,
  canAccessSchedule: false,
  canAccessBudget: false,
  canAccessDocuments: false,
  canAccessPhotos: false,
  canAccessTasks: false,
  canAccessReports: false,
  canAccessCommunication: false,
  canAccessTeam: false,
  canAccessDailyLogs: false,
  canAccessInspections: false,
  canAccessSafety: false,
  canAccessPunchList: false,
  canAccessBids: false,
  canAccessContracts: false,
  canAccessChangeOrders: false,
  canAccessRFIs: false,
  canAccessSubmittals: false,
  canAccessDrawings: false,
  canAccessSelections: false,
  canAccessWarranty: false,
  canAccessMeetings: false,
  canAccessAnalytics: false,
  canAccessFieldStatus: false,
}

// ── Context ───────────────────────────────────────────────────────

interface RoleContextValue {
  role: UserRole
  tier: SubscriptionTier
  isInternal: boolean
  isExternal: boolean
  permissions: RolePermissions
  userName: string
  companyName: string
  loading: boolean
}

const RoleContext = createContext<RoleContextValue>({
  role: "user",
  tier: "none",
  isInternal: false,
  isExternal: false,
  permissions: DEFAULT_PERMISSIONS,
  userName: "",
  companyName: "",
  loading: true,
})

export function useRole() {
  return useContext(RoleContext)
}

// ── Provider ──────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>("user")
  const [tier, setTier] = useState<SubscriptionTier>("none")
  const [userName, setUserName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchRole() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          if (!cancelled) setLoading(false)
          return
        }

        // Fetch user info
        const meRes = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })

        if (meRes.ok) {
          const meData = await meRes.json()
          const user = meData.user || meData
          if (!cancelled) {
            setUserName(user.name || user.firstName || "User")
          }
        }

        // Fetch org membership to determine role
        const orgsRes = await fetch(`${API_URL}/orgs/my`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })

        if (orgsRes.ok) {
          const orgsData = await orgsRes.json()
          const orgs = orgsData.orgs || orgsData || []
          if (orgs.length > 0) {
            const org = orgs[0]
            const roleKey = (org.roleKey || org.role || "user").toLowerCase()
            if (!cancelled) {
              setRole(roleKey as UserRole)
              setCompanyName(org.orgName || org.name || "")
              // Map subscription status to tier
              const subTier = (org.subscriptionTier || org.tier || "none").toLowerCase()
              setTier(subTier as SubscriptionTier)
            }
          }
        }
      } catch (err) {
        console.warn("Failed to fetch role context:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchRole()

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      setLoading(true)
      fetchRole()
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  const isInternal = INTERNAL_ROLES.includes(role)
  const isExternal = EXTERNAL_ROLES.includes(role)
  const permissions = getPermissions(role, tier)

  return (
    <RoleContext.Provider
      value={{ role, tier, isInternal, isExternal, permissions, userName, companyName, loading }}
    >
      {children}
    </RoleContext.Provider>
  )
}
