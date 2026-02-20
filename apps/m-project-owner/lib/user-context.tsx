"use client"

import * as React from "react"
import { supabase } from "./supabase"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OwnerRole = "homeowner" | "developer" | "property_manager" | "business_owner"
export type ProjectType =
  | "residential_single"
  | "residential_remodel"
  | "multifamily"
  | "mixed_use"
  | "commercial"
  | "industrial"
  | "hospitality"
  | "other"

export interface OwnerProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  role: OwnerRole
  projectType: ProjectType
  isMultifamily: boolean
  portalTabs: string[]
}

const MULTIFAMILY_TYPES: ProjectType[] = ["multifamily", "mixed_use"]

// Default tabs per role (must match signup-client.tsx)
const ROLE_TAB_DEFAULTS: Record<OwnerRole, string[]> = {
  homeowner: ["dashboard", "approvals", "reports", "help"],
  developer: ["dashboard", "projects", "draws", "approvals", "reports", "analytics", "help"],
  property_manager: ["dashboard", "projects", "units", "approvals", "reports", "help"],
  business_owner: ["dashboard", "projects", "approvals", "reports", "help"],
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface UserContextValue {
  profile: OwnerProfile | null
  loading: boolean
  isMultifamily: boolean
  isHomeowner: boolean
  isDeveloper: boolean
  isPropertyManager: boolean
  portalTabs: string[]
}

const UserContext = React.createContext<UserContextValue>({
  profile: null,
  loading: true,
  isMultifamily: false,
  isHomeowner: false,
  isDeveloper: false,
  isPropertyManager: false,
  portalTabs: ["dashboard", "approvals", "reports", "help"],
})

export function useOwnerProfile() {
  return React.useContext(UserContext)
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function OwnerProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = React.useState<OwnerProfile | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const meta = (user.user_metadata || {}) as Record<string, any>
          const role = (meta.role || "homeowner") as OwnerRole
          const projectType = (meta.projectType || "residential_single") as ProjectType
          const isMultifamily =
            meta.isMultifamily === true || MULTIFAMILY_TYPES.includes(projectType)

          // Portal tabs come from signup metadata, or fall back to role defaults
          let portalTabs = meta.portalTabs as string[] | undefined
          if (!portalTabs || !Array.isArray(portalTabs)) {
            portalTabs = ROLE_TAB_DEFAULTS[role] || ROLE_TAB_DEFAULTS.homeowner
            // If they have multifamily projects, add those tabs
            if (isMultifamily) {
              portalTabs = [...new Set([...portalTabs, "units", "draws", "phasing"])]
            }
          }

          setProfile({
            id: user.id,
            email: user.email || "",
            firstName: meta.firstName || "",
            lastName: meta.lastName || "",
            role,
            projectType,
            isMultifamily,
            portalTabs,
          })
        }
      } catch {
        // User not authenticated
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const value = React.useMemo<UserContextValue>(() => {
    const role = profile?.role
    const tabs = profile?.portalTabs || ROLE_TAB_DEFAULTS.homeowner
    return {
      profile,
      loading,
      isMultifamily: profile?.isMultifamily || false,
      isHomeowner: role === "homeowner",
      isDeveloper: role === "developer",
      isPropertyManager: role === "property_manager",
      portalTabs: tabs,
    }
  }, [profile, loading])

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
