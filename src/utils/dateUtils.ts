/**
 * Calculates the subsequent Monday following a given date.
 * Example: Thursday -> next Monday (+4 days), Friday -> next Monday (+3 days).
 * If the date is already a Monday, it returns the following Monday (+7 days).
 */
export function getNextMonday(startDateStr: string): string {
  if (!startDateStr) {
    startDateStr = new Date().toISOString().split('T')[0];
  }
  const parts = startDateStr.split('-').map(Number);
  const date = parts.length === 3
    ? new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0)
    : new Date(startDateStr + 'T12:00:00');

  const dayOfWeek = date.getDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
  const daysUntilMonday = (8 - dayOfWeek) % 7 || 7;
  date.setDate(date.getDate() + daysUntilMonday);

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Adds business days (dias úteis) to a date, skipping Saturdays and Sundays.
 */
export function addBusinessDays(startDateStr: string, businessDays: number = 7): string {
  if (!startDateStr) {
    startDateStr = new Date().toISOString().split('T')[0];
  }
  const parts = startDateStr.split('-').map(Number);
  const date = parts.length === 3
    ? new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0)
    : new Date(startDateStr + 'T12:00:00');

  let count = 0;
  while (count < businessDays) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    // 0 is Sunday, 6 is Saturday
    if (day !== 0 && day !== 6) {
      count++;
    }
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format date string (YYYY-MM-DD) to Brazilian format (DD/MM/YYYY)
 */
export function formatDateBR(dateStr?: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}
