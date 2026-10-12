export const getLocalDateKey = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getPreviousLocalDateKey = (date: Date = new Date()): string => {
  const previousDate = new Date(date);
  previousDate.setDate(previousDate.getDate() - 1);
  return getLocalDateKey(previousDate);
};

export const matchesLocalDate = (storedDate: string | null | undefined, date: Date): boolean =>
  storedDate === getLocalDateKey(date) || storedDate === date.toLocaleDateString('en-CA');

export const matchesPreviousLocalDate = (storedDate: string | null | undefined, date: Date): boolean => {
  const previousDate = new Date(date);
  previousDate.setDate(previousDate.getDate() - 1);
  return matchesLocalDate(storedDate, previousDate);
};