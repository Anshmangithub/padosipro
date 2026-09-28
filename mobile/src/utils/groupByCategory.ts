export function groupByCategory<T extends { category: string }>(
  items: T[],
): Array<{ title: string; data: T[] }> {
  const byCategory = new Map<string, T[]>();
  for (const item of items) {
    const bucket = byCategory.get(item.category) ?? [];
    bucket.push(item);
    byCategory.set(item.category, bucket);
  }
  return Array.from(byCategory.entries()).map(([title, data]) => ({ title, data }));
}
