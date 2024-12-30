export function getTaxYearDates(): { startDate: string; endDate: string } {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // If we're in Jan-Mar, use previous year as tax year start
  const taxYearStart = new Date(
    currentMonth <= 3 ? currentYear - 1 : currentYear,
    3, // April (0-based)
    1
  );

  const taxYearEnd = new Date(
    currentMonth <= 3 ? currentYear : currentYear + 1,
    2, // March (0-based)
    31
  );

  return {
    startDate: taxYearStart.toISOString(),
    endDate: taxYearEnd.toISOString(),
  };
}