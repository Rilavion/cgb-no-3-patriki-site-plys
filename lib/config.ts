import type { Organization } from "./types";

export const ORGANIZATIONS: Organization[] = [
  { id: "fso", name: "ФСО", shortName: "ФСО", color: "#67e8f9" },
  { id: "uvd_cao", name: "УВД по ЦАО", shortName: "УВД", color: "#60a5fa" },
  { id: "gibdd", name: "ГИБДД", shortName: "ГИБДД", color: "#818cf8" },
  { id: "vs_rf", name: "ВС РФ", shortName: "ВС РФ", color: "#a78bfa" },
  { id: "codd", name: "ЦОДД", shortName: "ЦОДД", color: "#2dd4bf" },
  { id: "fsvng", name: "ФСВНГ", shortName: "ФСВНГ", color: "#34d399" },
  { id: "fsin", name: "ФСИН", shortName: "ФСИН", color: "#fbbf24" },
  {
    id: "moscow_life",
    name: "Москва-Лайф",
    shortName: "М-Лайф",
    color: "#fb7185",
  },
];

export const LOCATIONS = { ZMH: "ЗМХ", MS: "МС" } as const;
export const DELIVERY_STATUSES = {
  DELIVERED: "Довезли",
  NOT_DELIVERED: "Не довезли",
  UNKNOWN: "Не указан",
} as const;
export const MAX_COUNT_PER_ORGANIZATION = 999;
export const MAX_RECIPIENT_LENGTH = 120;
export const MOSCOW_TIME_ZONE = "Europe/Moscow";

export const PERIOD_OPTIONS = [
  ["today", "Сегодня"],
  ["7days", "Последние 7 дней"],
  ["month", "Текущий месяц"],
  ["lastMonth", "Прошлый месяц"],
  ["3months", "Последние 3 месяца"],
  ["year", "Год"],
  ["all", "Всё время"],
  ["custom", "Свой период"],
] as const;
