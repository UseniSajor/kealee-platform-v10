'use client';

import React, { useState, createContext, useContext } from 'react';
import { cn } from '../../lib/utils';
import { type ModuleTheme, getThemeCSSVariables } from '../../themes';

/**
 * AppShell Context
 */
interface AppShellContextValue {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  theme: ModuleTheme | null;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function useAppShell() {
  const context = useContext(AppShellContext);
  if (!context) {
    throw new Error('useAppShell must be used within an AppShell');
  }
  return context;
}

/**
 * AppShell Props
 */
export interface AppShellProps {
  children: React.ReactNode;
  theme?: ModuleTheme;
  variant?: 'client' | 'operational';
  className?: string;
}

/**
 * AppShell Component
 * Main app wrapper that provides layout context and theme
 *
 * Usage:
 * ```tsx
 * <AppShell theme={getModuleTheme('m-project-owner')} variant="client">
 *   <TopNav />
 *   <div className="flex">
 *     <Sidebar />
 *     <main>{children}</main>
 *   </div>
 * </AppShell>
 * ```
 */
export function AppShell({
  children,
  theme,
  variant = 'client',
  className
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const themeStyles = theme ? getThemeCSSVariables(theme) : {};

  return (
    <AppShellContext.Provider
      value={{
        sidebarOpen,
        setSidebarOpen,
        sidebarCollapsed,
        setSidebarCollapsed,
        theme: theme || null,
      }}
    >
      <div
        className={cn(
          'min-h-screen',
          variant === 'client' && 'bg-gray-50',
          variant === 'operational' && 'bg-gray-900 text-white',
          className
        )}
        style={themeStyles as React.CSSProperties}
      >
        {children}
      </div>
    </AppShellContext.Provider>
  );
}

/**
 * ClientPortalLayout
 * Standard layout for client-facing apps (m-* apps)
 */
export interface ClientPortalLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  topNav?: React.ReactNode;
  theme?: ModuleTheme;
  className?: string;
}

export function ClientPortalLayout({
  children,
  sidebar,
  topNav,
  theme,
  className,
}: ClientPortalLayoutProps) {
  return (
    <AppShell theme={theme} variant="client" className={className}>
      {topNav}
      <div className="flex">
        {sidebar}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </AppShell>
  );
}

/**
 * OperationalLayout
 * Dense layout for operational apps (os-* apps)
 */
export interface OperationalLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  topNav?: React.ReactNode;
  leftPanel?: React.ReactNode;
  rightPanel?: React.ReactNode;
  theme?: ModuleTheme;
  className?: string;
}

export function OperationalLayout({
  children,
  sidebar,
  topNav,
  leftPanel,
  rightPanel,
  theme,
  className,
}: OperationalLayoutProps) {
  return (
    <AppShell theme={theme} variant="operational" className={className}>
      {topNav}
      <div className="flex">
        {sidebar}
        <main className="flex-1 p-4">
          <div className="flex gap-4 h-[calc(100vh-4rem)]">
            {leftPanel && (
              <div className="w-1/3 overflow-y-auto">{leftPanel}</div>
            )}
            <div className="flex-1 overflow-y-auto">{children}</div>
            {rightPanel && (
              <div className="w-1/4 overflow-y-auto">{rightPanel}</div>
            )}
          </div>
        </main>
      </div>
    </AppShell>
  );
}

export default AppShell;
