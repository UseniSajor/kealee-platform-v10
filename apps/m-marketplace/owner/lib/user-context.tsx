"use client"

import * as React from "react"
import { useUser } from '@clerk/nextjs'

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
  const { user, isLoaded } = useUser()
  const profile = React.useMemo<OwnerProfile | null>(() => {
    if (!user) return null
    const meta = user.publicMetadata as Record<string, unknown>
    const role = String(meta.role || "homeowner") as OwnerRole
    const projectType = String(meta.projectType || "residential_single") as ProjectType
    const isMultifamily = meta.isMultifamily === true || MULTIFAMILY_TYPES.includes(projectType)
    let portalTabs = Array.isArray(meta.portalTabs) ? meta.portalTabs.map(String) : ROLE_TAB_DEFAULTS[role]
    if (!portalTabs) portalTabs = ROLE_TAB_DEFAULTS.homeowner
    if (isMultifamily) portalTabs = [...new Set([...portalTabs, "units", "draws", "phasing"])]

    return {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role,
      projectType,
      isMultifamily,
      portalTabs,
    }
  }, [user])
  const loading = !isLoaded

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
