/** The periods the dashboard offers, in days. */
export const ADMIN_PERIODS = [7, 30, 90, 365] as const;

export type AdminPeriod = (typeof ADMIN_PERIODS)[number];

export function adminPeriod(raw: string | string[] | undefined | null): AdminPeriod {
  return ADMIN_PERIODS.find((days) => String(days) === raw) ?? 30;
}
