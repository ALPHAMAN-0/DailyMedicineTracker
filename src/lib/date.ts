const TIME_ZONE = "Asia/Dhaka";

/** Today's date as "yyyy-MM-dd" in Asia/Dhaka, regardless of server timezone. */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** e.g. "Fri, 12 Sep" for display in the UI, in Asia/Dhaka. */
export function todayDisplay(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date());
}

/** e.g. "2026-09-12" -> "September 2026", used as the monthly tab name. */
export function monthTabName(isoDate: string): string {
  const [year] = isoDate.split("-");
  const monthName = new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: TIME_ZONE,
  }).format(new Date(`${isoDate}T00:00:00+06:00`));
  return `${monthName} ${year}`;
}
