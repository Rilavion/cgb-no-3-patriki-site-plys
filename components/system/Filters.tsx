'use client';

import { CalendarRange, Search } from 'lucide-react';
import { ORGANIZATIONS, PERIOD_OPTIONS } from '@/lib/config';
import type { FilterState } from '@/lib/types';

export const DEFAULT_FILTERS: FilterState = {
  period: 'month',
  location: 'ALL',
  organization: 'ALL',
  from: '',
  to: '',
  search: '',
};

export function Filters({
  value,
  onChange,
  withSearch = false,
}: {
  value: FilterState;
  onChange: (value: FilterState) => void;
  withSearch?: boolean;
}) {
  const set = <K extends keyof FilterState>(key: K, next: FilterState[K]) =>
    onChange({ ...value, [key]: next });
  const control =
    'h-11 rounded-xl border border-white/10 bg-[#0a1726] px-3 text-sm text-slate-200 outline-none focus:border-cyan-300/50';
  return (
    <div className="rounded-2xl border border-white/8 bg-[#0b1827] p-3 sm:p-4">
      <div className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-1.5 text-xs text-slate-500">
          <span>Период</span>
          <select
            className={control}
            value={value.period}
            onChange={(event) =>
              set('period', event.target.value as FilterState['period'])
            }
          >
            {PERIOD_OPTIONS.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-xs text-slate-500">
          <span>Место</span>
          <select
            className={control}
            value={value.location}
            onChange={(event) =>
              set('location', event.target.value as FilterState['location'])
            }
          >
            <option value="ALL">Все места</option>
            <option value="ZMH">ЗМХ</option>
            <option value="MS">МС</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-xs text-slate-500">
          <span>Организация</span>
          <select
            className={control}
            value={value.organization}
            onChange={(event) => set('organization', event.target.value)}
          >
            <option value="ALL">Все организации</option>
            {ORGANIZATIONS.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {value.period === 'custom' && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-xs text-slate-500">
            <span>Дата от</span>
            <div className="relative">
              <CalendarRange
                size={16}
                className="pointer-events-none absolute left-3 top-3.5"
              />
              <input
                type="date"
                value={value.from}
                onChange={(event) => set('from', event.target.value)}
                className={`${control} w-full pl-9`}
              />
            </div>
          </label>
          <label className="grid gap-1.5 text-xs text-slate-500">
            <span>Дата до</span>
            <input
              type="date"
              value={value.to}
              onChange={(event) => set('to', event.target.value)}
              className={`${control} w-full`}
            />
          </label>
        </div>
      )}
      {withSearch && (
        <label className="relative mt-3 block">
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-3 text-slate-500"
          />
          <input
            type="search"
            value={value.search}
            onChange={(event) => set('search', event.target.value)}
            placeholder="Поиск по дате, месту или комментарию"
            className={`${control} w-full pl-10`}
          />
        </label>
      )}
    </div>
  );
}
