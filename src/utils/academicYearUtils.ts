/**
 * Utility functions for validating and generating standard Academic Year options (YYYY-YYYY format).
 */

export interface AcademicYearOption {
  id: number | string;
  academicYear: string;
  name: string;
}

/**
 * Validates if a string follows the standard YYYY-YYYY academic year format (e.g., "2024-2025").
 */
export function isValidAcademicYearFormat(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  return /^\d{4}-\d{4}$/.test(trimmed);
}

/**
 * Generates a standard programmatic list of academic year options for a reasonable range:
 * current year - 1 through current year + 4 (e.g. 2024-2025, 2025-2026, 2026-2027, etc.).
 */
export function getStandardAcademicYears(startOffset = -1, endOffset = 4): AcademicYearOption[] {
  const currentYear = new Date().getFullYear();
  const list: AcademicYearOption[] = [];
  for (let i = startOffset; i <= endOffset; i++) {
    const start = currentYear + i;
    const label = `${start}-${start + 1}`;
    list.push({
      id: label,
      academicYear: label,
      name: label
    });
  }
  return list;
}

/**
 * Sanitizes an array of academic year items from the backend API:
 * 1. Filters out invalid entries (such as "8", "9", "855", etc.).
 * 2. Preserves valid entries (including their database numeric IDs).
 * 3. Falls back to or merges standard academic years if list is empty or missing future years.
 */
export function sanitizeAcademicYears(rawList: any[]): AcademicYearOption[] {
  if (!Array.isArray(rawList)) {
    return getStandardAcademicYears();
  }

  const validEntries: AcademicYearOption[] = [];
  const seenLabels = new Set<string>();

  for (const item of rawList) {
    if (!item) continue;
    const label = (item.academicYear || item.yearName || item.name || item.code || '').trim();
    if (isValidAcademicYearFormat(label) && !seenLabels.has(label)) {
      seenLabels.add(label);
      validEntries.push({
        id: item.id ?? label,
        academicYear: label,
        name: label
      });
    }
  }

  if (validEntries.length === 0) {
    return getStandardAcademicYears();
  }

  // Ensure current and upcoming standard academic years are available if missing from DB
  const standardYears = getStandardAcademicYears();
  for (const std of standardYears) {
    if (!seenLabels.has(std.academicYear)) {
      validEntries.push(std);
      seenLabels.add(std.academicYear);
    }
  }

  // Sort chronologically based on starting 4 digits
  return validEntries.sort((a, b) => {
    const startA = parseInt(a.academicYear.split('-')[0], 10) || 0;
    const startB = parseInt(b.academicYear.split('-')[0], 10) || 0;
    return startA - startB;
  });
}
