export function testId(id: string): string {
  return `[data-testid="${id}"]`;
}

export function dynamicTestId(prefix: string, value: string): string {
  return testId(`${prefix}-${value}`);
}

export function escapeForTextSelector(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
