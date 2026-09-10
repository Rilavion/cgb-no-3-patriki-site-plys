import { ORGANIZATIONS } from './config';
import { getPeriodRange } from './date';
import type { FilterState, Supply } from './types';

export function filterSupplies(
  supplies: Supply[],
  filters: FilterState,
  includeSearch = false,
) {
  const { start, end } = getPeriodRange(
    filters.period,
    filters.from,
    filters.to,
  );
  const needle = filters.search.trim().toLocaleLowerCase('ru');
  return supplies.filter((supply) => {
    if (start && supply.eventAt < start) return false;
    if (end && supply.eventAt > end) return false;
    if (filters.location !== 'ALL' && supply.location !== filters.location)
      return false;
    if (
      filters.organization !== 'ALL' &&
      (supply.organizations[filters.organization] ?? 0) <= 0
    )
      return false;
    if (includeSearch && needle) {
      const text =
        `${supply.comment} ${supply.location === 'ZMH' ? 'змх' : 'мс'} ${supply.eventAt.toLocaleDateString('ru-RU')}`.toLocaleLowerCase(
          'ru',
        );
      if (!text.includes(needle)) return false;
    }
    return true;
  });
}

export function getAnalytics(
  supplies: Supply[],
  organizationFilter: string = 'ALL',
) {
  const countFor = (supply: Supply, id: string) =>
    supply.organizations[id] ?? 0;
  const effectiveTotal = (supply: Supply) =>
    organizationFilter === 'ALL'
      ? supply.total
      : countFor(supply, organizationFilter);
  const totalPeople = supplies.reduce(
    (sum, supply) => sum + effectiveTotal(supply),
    0,
  );
  const organizations = ORGANIZATIONS.map((org) => {
    const values = supplies.map((supply) => countFor(supply, org.id));
    const positive = values.filter((value) => value > 0);
    const total = values.reduce((sum, value) => sum + value, 0);
    return {
      ...org,
      total,
      participations: positive.length,
      average: positive.length ? total / positive.length : 0,
      max: positive.length ? Math.max(...positive) : 0,
      min: positive.length ? Math.min(...positive) : 0,
      share: totalPeople ? (total / totalPeople) * 100 : 0,
    };
  })
    .filter(
      (org) => organizationFilter === 'ALL' || org.id === organizationFilter,
    )
    .sort((a, b) => b.total - a.total);
  const byLocation = (['ZMH', 'MS'] as const).map((location) => {
    const rows = supplies.filter((supply) => supply.location === location);
    const people = rows.reduce(
      (sum, supply) => sum + effectiveTotal(supply),
      0,
    );
    return {
      location,
      supplies: rows.length,
      people,
      average: rows.length ? people / rows.length : 0,
      share: totalPeople ? (people / totalPeople) * 100 : 0,
    };
  });
  return {
    supplyCount: supplies.length,
    totalPeople,
    average: supplies.length ? totalPeople / supplies.length : 0,
    activeOrganizations: organizations.filter((org) => org.total > 0).length,
    organizations,
    byLocation,
  };
}
