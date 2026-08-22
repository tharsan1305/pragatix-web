export const normalizeYearString = (raw: any): string => {
  if (!raw) return '';
  const s = String(raw).trim().toUpperCase();
  if (s.includes('FIRST') || s === '1' || s === 'I' || s.includes('1ST') || s.includes('YEAR 1') || s.includes('1 YEAR')) return '1';
  if (s.includes('SECOND') || s === '2' || s === 'II' || s.includes('2ND') || s.includes('YEAR 2') || s.includes('2 YEAR')) return '2';
  if (s.includes('THIRD') || s === '3' || s === 'III' || s.includes('3RD') || s.includes('YEAR 3') || s.includes('3 YEAR')) return '3';
  if (s.includes('FOURTH') || s === '4' || s === 'IV' || s.includes('4TH') || s.includes('YEAR 4') || s.includes('4 YEAR')) return '4';
  return s;
};

export const formatYearDisplay = (raw: any): string => {
  if (!raw) return '1st Year';
  const num = normalizeYearString(raw);
  if (num === '1') return '1st Year';
  if (num === '2') return '2nd Year';
  if (num === '3') return '3rd Year';
  if (num === '4') return '4th Year';
  return String(raw);
};

export const normalizeSection = (raw: any): string => {
  if (!raw) return '';
  return String(raw).replace(/^(SECTION|SEC)\s*/i, '').trim().toUpperCase();
};

export const formatSectionDisplay = (raw: any): string => {
  if (!raw) return 'Section A';
  const s = String(raw).trim();
  if (s.toLowerCase().startsWith('section')) return s;
  return `Section ${s}`;
};

export const isMatchingYear = (itemYear: any, selectedYr: string): boolean => {
  if (!selectedYr || selectedYr === 'All' || selectedYr === 'ALL' || selectedYr === 'All Years') return true;
  if (!itemYear) return false;
  const nItem = normalizeYearString(itemYear);
  const nSel = normalizeYearString(selectedYr);
  return nItem === nSel || String(itemYear).trim().toLowerCase() === String(selectedYr).trim().toLowerCase();
};

export const isMatchingSection = (itemSec: any, selectedSec: string): boolean => {
  if (!selectedSec || selectedSec === 'All' || selectedSec === 'ALL' || selectedSec === 'All Sections') return true;
  if (!itemSec) return false;
  return normalizeSection(itemSec) === normalizeSection(selectedSec);
};

export const isMatchingDept = (itemDept: any, selectedDept: string): boolean => {
  if (!selectedDept || selectedDept === 'All' || selectedDept === 'ALL' || selectedDept === 'All Departments') return true;
  if (!itemDept) return false;
  const d1 = String(itemDept).trim().toLowerCase();
  const d2 = String(selectedDept).trim().toLowerCase();
  return d1 === d2 || d1.includes(d2) || d2.includes(d1);
};

export const mapYearToEnumName = (rawYear: string) => {
  if (!rawYear || rawYear === "All" || rawYear === "ALL" || rawYear === "All Years") return undefined;
  const clean = rawYear.trim().toUpperCase();
  if (clean.includes('FIRST') || clean === '1' || clean === 'I' || clean.includes('1ST')) {
    return 'FIRST_YEAR';
  }
  if (clean.includes('SECOND') || clean === '2' || clean === 'II' || clean.includes('2ND')) {
    return 'SECOND_YEAR';
  }
  if (clean.includes('THIRD') || clean === '3' || clean === 'III' || clean.includes('3RD')) {
    return 'THIRD_YEAR';
  }
  if (clean.includes('FOURTH') || clean === '4' || clean === 'IV' || clean.includes('4TH')) {
    return 'FOURTH_YEAR';
  }
  return undefined;
};
