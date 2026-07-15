export function scenarioMarker(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}
