export function getCurrentSeasonLabel(referenceDate = new Date()) {
  const month = referenceDate.getUTCMonth();
  const year = referenceDate.getUTCFullYear();

  if (month <= 2) {
    return `Winter ${year}`;
  }

  if (month <= 5) {
    return `Spring ${year}`;
  }

  if (month <= 8) {
    return `Summer ${year}`;
  }

  return `Fall ${year}`;
}