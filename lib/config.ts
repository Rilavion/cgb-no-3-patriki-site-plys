import type { Organization } from "./types";

export const ORGANIZATIONS: Organization[] = [
  { id: "fso", name: "ФСО", shortName: "ФСО", emoji: "🛡️", color: "#67e8f9" },
  {
    id: "uvd_cao",
    name: "УВД по ЦАО",
    shortName: "УВД",
    emoji: "👮",
    color: "#60a5fa",
  },
  {
    id: "gibdd",
    name: "ГИБДД",
    shortName: "ГИБДД",
    emoji: "🚔",
    color: "#818cf8",
  },
  {
    id: "vs_rf",
    name: "ВС РФ",
    shortName: "ВС РФ",
    emoji: "🪖",
    color: "#a78bfa",
  },
  {
    id: "codd",
    name: "ЦОДД",
    shortName: "ЦОДД",
    emoji: "🚦",
    color: "#2dd4bf",
  },
  {
    id: "fsvng",
    name: "ФСВНГ",
    shortName: "ФСВНГ",
    emoji: "⚔️",
    color: "#34d399",
  },
  {
    id: "fsin",
    name: "ФСИН",
    shortName: "ФСИН",
    emoji: "🔒",
    color: "#fbbf24",
  },
  {
    id: "moscow_life",
    name: "Москва-Лайф",
    shortName: "М-Лайф",
    emoji: "📡",
    color: "#fb7185",
  },
  {
    id: "cgb7",
    name: "ЦГБ №7",
    shortName: "ЦГБ №7",
    emoji: "🏥",
    color: "#fb923c",
  },
];

export const ADDITIONAL_RECIPIENTS = [
  { id: "government", name: "Правительство", emoji: "🏛️" },
  { id: "court", name: "Суд", emoji: "⚖️" },
  { id: "prosecutor", name: "Прокуратура", emoji: "📜" },
  { id: "investigative_committee", name: "СК", emoji: "🔎" },
] as const;

export const RECIPIENT_OPTIONS = [
  ...ORGANIZATIONS.map(({ id, name, emoji }) => ({ id, name, emoji })),
  ...ADDITIONAL_RECIPIENTS,
] as const;

export function getRecipientEmoji(name: string) {
  return RECIPIENT_OPTIONS.find((recipient) => recipient.name === name)?.emoji ?? "📦";
}

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
