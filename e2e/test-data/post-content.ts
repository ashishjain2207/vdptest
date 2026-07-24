export function buildUniquePostText(): string {
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `E2E feed composer publish verification ${uniqueSuffix}`;
}
