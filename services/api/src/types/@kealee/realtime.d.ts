declare module '@kealee/realtime' {
  export function broadcastToProject(...args: any[]): any
  export function notifySensorAlert(...args: any[]): any
  export function notifySensorOffline(...args: any[]): any
  export function notifyEstimateCreated(...args: any[]): any
  export function useProjectChannel(...args: any[]): any
  export function useUserChannel(...args: any[]): any
  export function usePresence(...args: any[]): any
  export function usePlatformPresence(...args: any[]): any
}
