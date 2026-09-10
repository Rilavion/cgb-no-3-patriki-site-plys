'use client';

import { Clipboard, Download, FileJson, Sheet } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { filterSupplies, getAnalytics } from '@/lib/analytics';
import { LOCATIONS, PERIOD_OPTIONS } from '@/lib/config';
import { formatDate, formatTime } from '@/lib/date';
import { downloadBlob, exportCsv, exportJson } from '@/lib/export';
import type { FilterState, Supply } from '@/lib/types';
import { DEFAULT_FILTERS, Filters } from './Filters';
import { EmptyState } from './controls';

const tooltipStyle = {
  background: '#091626',
  border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 12,
  color: '#e8f0f7',
};
const number = new Intl.NumberFormat('ru-RU');

function Metric({
  value,
  label,
  suffix,
}: {
  value: string | number;
  label: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-[#0b1827] p-5">
      <p className="text-3xl font-semibold tabular-nums text-white">
        {value}
        {suffix && (
          <span className="ml-1 text-base text-slate-500">{suffix}</span>
        )}
      </p>
      <p className="mt-2 text-sm text-slate-500">{label}</p>
    </div>
  );
}

export function StatsView({
  supplies,
  onStatus,
}: {
  supplies: Supply[];
  onStatus: (message: string, tone?: 'success' | 'error') => void;
}) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [creatingPng, setCreatingPng] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const visible = useMemo(
    () => filterSupplies(supplies, filters),
    [supplies, filters],
  );
  const analytics = useMemo(
    () => getAnalytics(visible, filters.organization),
    [visible, filters.organization],
  );
  const chartData = useMemo(
    () =>
      [...visible]
        .reverse()
        .map((supply) => ({
          date: formatDate(supply.eventAt),
          time: formatTime(supply.eventAt),
          value:
            filters.organization === 'ALL'
              ? supply.total
              : (supply.organizations[filters.organization] ?? 0),
          place: LOCATIONS[supply.location],
        })),
    [visible, filters.organization],
  );
  const periodLabel =
    PERIOD_OPTIONS.find(([key]) => key === filters.period)?.[1] ?? 'Период';

  async function makePng(copy: boolean) {
    if (!cardRef.current) return;
    setCreatingPng(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#07111e',
        scale: 1.5,
        logging: false,
        useCORS: true,
      });
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png', 1),
      );
      if (!blob) throw new Error('Не удалось сформировать изображение.');
      if (copy && 'ClipboardItem' in window && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        onStatus('PNG-карточка скопирована в буфер обмена.', 'success');
      } else {
        downloadBlob(
          blob,
          `supply-statistics-${new Date().toISOString().slice(0, 10)}.png`,
        );
        onStatus(
          copy
            ? 'Копирование изображений не поддерживается — PNG скачан.'
            : 'PNG-карточка скачана.',
          'success',
        );
      }
    } catch (error) {
      onStatus(
        error instanceof Error ? error.message : 'Не удалось создать PNG.',
        'error',
      );
    } finally {
      setCreatingPng(false);
    }
  }

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-300">
            Аналитический контур
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Статистика поставок
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Показатели пересчитываются автоматически по данным Firestore.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => exportCsv(visible)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300"
          >
            <Sheet size={16} />
            CSV
          </button>
          <button
            onClick={() => exportJson(visible)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300"
          >
            <FileJson size={16} />
            JSON
          </button>
        </div>
      </div>
      <Filters value={filters} onChange={setFilters} />

      {!visible.length ? (
        <div className="mt-5">
          <EmptyState
            title="Нет данных за выбранный период"
            description="Измените фильтры или добавьте поставку."
          />
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric value={analytics.supplyCount} label="поставок" />
            <Metric
              value={number.format(analytics.totalPeople)}
              label="сотрудников учтено"
            />
            <Metric
              value={analytics.average.toFixed(1)}
              label="в среднем на поставку"
            />
            <Metric
              value={analytics.activeOrganizations}
              label="активных организаций"
            />
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <article className="rounded-2xl border border-white/8 bg-[#0b1827] p-4 sm:p-5">
              <div className="mb-5">
                <h2 className="font-semibold text-white">
                  Количество сотрудников по поставкам
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Хронология выбранного периода
                </p>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ left: -18, right: 8 }}>
                    <defs>
                      <linearGradient id="activity" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="#67e8f9"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="100%"
                          stopColor="#67e8f9"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="rgba(255,255,255,.06)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value) => [
                        `${String(value)} сотрудников`,
                        'Учтено',
                      ]}
                      labelFormatter={(label, payload) =>
                        `${String(label)} · ${String(payload?.[0]?.payload?.time ?? '')} · ${String(payload?.[0]?.payload?.place ?? '')}`
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#67e8f9"
                      strokeWidth={2.5}
                      fill="url(#activity)"
                      activeDot={{
                        r: 5,
                        fill: '#67e8f9',
                        stroke: '#07111e',
                        strokeWidth: 3,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </article>
            <article className="rounded-2xl border border-white/8 bg-[#0b1827] p-4 sm:p-5">
              <h2 className="font-semibold text-white">
                Распределение по организациям
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Доля от общего числа
              </p>
              <div className="grid items-center sm:grid-cols-[210px_1fr] xl:grid-cols-1 2xl:grid-cols-[210px_1fr]">
                <div className="relative h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.organizations
                          .filter((org) => org.total > 0)
                          .map((org) => ({ ...org, fill: org.color }))}
                        dataKey="total"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={85}
                        paddingAngle={2}
                        stroke="none"
                      />
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                    <div>
                      <p className="text-2xl font-semibold text-white">
                        {number.format(analytics.totalPeople)}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">
                        всего
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid gap-2">
                  {analytics.organizations
                    .filter((org) => org.total > 0)
                    .map((org) => (
                      <div
                        key={org.id}
                        className="grid grid-cols-[8px_1fr_auto] items-center gap-2 text-xs"
                      >
                        <span
                          className="size-2 rounded-full"
                          style={{ background: org.color }}
                        />
                        <span className="truncate text-slate-400">
                          {org.name}
                        </span>
                        <strong className="tabular-nums text-slate-200">
                          {org.share.toFixed(1)}%
                        </strong>
                      </div>
                    ))}
                </div>
              </div>
            </article>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <article className="rounded-2xl border border-white/8 bg-[#0b1827] p-5">
              <h2 className="font-semibold text-white">Топ организаций</h2>
              <div className="mt-5 grid gap-4">
                {analytics.organizations.map((org, index) => (
                  <div key={org.id}>
                    <div className="mb-1.5 flex justify-between gap-4 text-sm">
                      <span className="text-slate-300">
                        <span className="mr-2 text-slate-600">
                          {index + 1}.
                        </span>
                        {org.name}
                      </span>
                      <strong className="tabular-nums text-white">
                        {number.format(org.total)}
                      </strong>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/[.05]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${analytics.organizations[0]?.total ? (org.total / analytics.organizations[0].total) * 100 : 0}%`,
                          background: org.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>
            <article className="rounded-2xl border border-white/8 bg-[#0b1827] p-5">
              <h2 className="font-semibold text-white">ЗМХ / МС</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {analytics.byLocation.map((item) => (
                  <div
                    key={item.location}
                    className="rounded-xl border border-white/8 bg-white/[.025] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-lg text-white">
                        {LOCATIONS[item.location]}
                      </strong>
                      <span className="text-sm font-semibold text-cyan-300">
                        {item.share.toFixed(0)}%
                      </span>
                    </div>
                    <p className="mt-5 text-2xl font-semibold text-white">
                      {number.format(item.people)}
                    </p>
                    <p className="text-xs text-slate-500">сотрудников</p>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-slate-500">Поставок</p>
                        <p className="mt-1 text-slate-200">{item.supplies}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Среднее</p>
                        <p className="mt-1 text-slate-200">
                          {item.average.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <article className="mt-5 overflow-hidden rounded-2xl border border-white/8 bg-[#0b1827]">
            <div className="border-b border-white/8 p-5">
              <h2 className="font-semibold text-white">
                Статистика по организациям
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-slate-600">
                  <tr>
                    {[
                      'Организация',
                      'Всего',
                      'Поставок',
                      'Среднее',
                      'Мин.',
                      'Макс.',
                      'Доля',
                    ].map((name) => (
                      <th key={name} className="px-5 py-3 font-medium">
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analytics.organizations.map((org) => (
                    <tr key={org.id} className="border-t border-white/6">
                      <td className="px-5 py-4 font-medium text-slate-200">
                        {org.name}
                      </td>
                      <td className="px-5 py-4 tabular-nums text-white">
                        {number.format(org.total)}
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {org.participations}
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {org.average.toFixed(1)}
                      </td>
                      <td className="px-5 py-4 text-slate-400">{org.min}</td>
                      <td className="px-5 py-4 text-slate-400">{org.max}</td>
                      <td className="px-5 py-4 text-slate-400">
                        {org.share.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Специальная карточка 1600 × 900 создаётся отдельно от страницы.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                disabled={creatingPng}
                onClick={() => makePng(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/8 px-4 py-3 text-sm font-semibold text-cyan-100 disabled:opacity-50"
              >
                <Clipboard size={16} />
                {creatingPng ? 'Создаём PNG…' : 'Скопировать статистику'}
              </button>
              <button
                disabled={creatingPng}
                onClick={() => makePng(false)}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-bold text-[#07111e] disabled:opacity-50"
              >
                <Download size={16} />
                Скачать PNG
              </button>
            </div>
          </div>

          <div
            className="fixed -left-[10000px] top-0 w-[1600px]"
            aria-hidden="true"
          >
            <ShareCard
              ref={cardRef}
              analytics={analytics}
              period={periodLabel}
            />
          </div>
        </>
      )}
    </section>
  );
}

import { forwardRef } from 'react';
const ShareCard = forwardRef<
  HTMLDivElement,
  { analytics: ReturnType<typeof getAnalytics>; period: string }
>(({ analytics, period }, ref) => (
  <div
    ref={ref}
    className="h-[900px] w-[1600px] overflow-hidden bg-[#07111e] p-20 text-white"
    style={{
      fontFamily: 'Inter, Arial, sans-serif',
      backgroundImage:
        'radial-gradient(circle at 85% 0%, rgba(34,211,238,.16), transparent 32%)',
    }}
  >
    <div className="flex items-start justify-between border-b border-white/10 pb-10">
      <div>
        <p className="text-2xl font-semibold uppercase tracking-[.22em] text-cyan-300">
          Учёт поставок
        </p>
        <h2 className="mt-5 text-6xl font-semibold">Оперативная статистика</h2>
        <p className="mt-4 text-2xl text-slate-400">{period}</p>
      </div>
      <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/8 px-8 py-6 text-right">
        <p className="text-lg text-slate-400">Сформировано</p>
        <p className="mt-2 text-2xl font-semibold">
          {new Intl.DateTimeFormat('ru-RU', {
            timeZone: 'Europe/Moscow',
            dateStyle: 'long',
            timeStyle: 'short',
          }).format(new Date())}
        </p>
      </div>
    </div>
    <div className="mt-10 grid grid-cols-3 gap-6">
      <Metric value={analytics.supplyCount} label="поставок" />
      <Metric
        value={number.format(analytics.totalPeople)}
        label="сотрудников учтено"
      />
      <Metric
        value={analytics.average.toFixed(1)}
        label="в среднем на поставку"
      />
    </div>
    <div className="mt-10 grid grid-cols-[1.25fr_.75fr] gap-10">
      <div>
        <h3 className="text-2xl font-semibold">Топ организаций</h3>
        <div className="mt-7 grid gap-5">
          {analytics.organizations.slice(0, 6).map((org, index) => (
            <div key={org.id}>
              <div className="mb-2 flex justify-between text-xl">
                <span>
                  <span className="mr-4 text-slate-600">{index + 1}</span>
                  {org.name}
                </span>
                <strong>{number.format(org.total)}</strong>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/[.06]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${analytics.organizations[0]?.total ? (org.total / analytics.organizations[0].total) * 100 : 0}%`,
                    background: org.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-semibold">ЗМХ / МС</h3>
        <div className="mt-7 grid gap-5">
          {analytics.byLocation.map((item) => (
            <div
              key={item.location}
              className="rounded-3xl border border-white/10 bg-white/[.035] p-7"
            >
              <div className="flex justify-between">
                <strong className="text-3xl">{LOCATIONS[item.location]}</strong>
                <span className="text-2xl text-cyan-300">
                  {item.share.toFixed(0)}%
                </span>
              </div>
              <p className="mt-6 text-5xl font-semibold">
                {number.format(item.people)}
              </p>
              <p className="mt-2 text-lg text-slate-500">
                сотрудников · {item.supplies} поставок
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
));
ShareCard.displayName = 'ShareCard';
