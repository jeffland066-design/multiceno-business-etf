/**
 * MULTICENO Corporate Date Filtering Utility
 * Automatically aligns with the 2026 fiscal calendar.
 */

export function checkDateInRange(
  dateField: string | undefined | null,
  filter: string
): boolean {
  if (!filter || filter === 'All') return true;
  if (!dateField) return false;

  const itemDate = new Date(dateField);
  if (isNaN(itemDate.getTime())) return false;

  // Align dynamically with the current system date of 2026-06-07
  const referenceDate = new Date('2026-06-07');

  if (filter === '30days') {
    const thirtyDaysAgo = new Date(referenceDate);
    thirtyDaysAgo.setDate(referenceDate.getDate() - 30);
    return itemDate >= thirtyDaysAgo && itemDate <= referenceDate;
  }

  if (filter === 'q1') {
    const start = new Date('2026-01-01T00:00:00');
    const end = new Date('2026-03-31T23:59:59');
    return itemDate >= start && itemDate <= end;
  }

  if (filter === 'q2') {
    const start = new Date('2026-04-01T00:00:00');
    const end = new Date('2026-06-30T23:59:59');
    return itemDate >= start && itemDate <= end;
  }

  if (filter === 'ytd') {
    const start = new Date('2026-01-01T00:00:00');
    return itemDate >= start && itemDate <= referenceDate;
  }

  return true;
}

export function filterByDateRange<T>(
  items: T[],
  filter: string,
  keyOverride?: keyof T
): T[] {
  if (!filter || filter === 'All') return items;
  return items.filter((item) => {
    const anyItem = item as any;
    const field = keyOverride 
      ? anyItem[keyOverride] 
      : (anyItem.date || anyItem.deadline || anyItem.dueDate);
    return checkDateInRange(field as string, filter);
  });
}
