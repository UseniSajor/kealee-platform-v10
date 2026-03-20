export function generateCaptureToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

export function generateCaptureId(): string {
  return `cs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function generateAssetId(): string {
  return `ca_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function generateVoiceNoteId(): string {
  return `vn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function computeProgressPercent(
  requiredZones: string[],
  completedZones: string[],
): number {
  if (requiredZones.length === 0) return 0;
  const done = requiredZones.filter((z) => completedZones.includes(z)).length;
  return Math.round((done / requiredZones.length) * 100);
}

export function getTokenExpiresAt(hoursFromNow = 48): string {
  const d = new Date();
  d.setHours(d.getHours() + hoursFromNow);
  return d.toISOString();
}

export function isTokenExpired(tokenExpiresAt: string): boolean {
  return new Date(tokenExpiresAt) < new Date();
}
