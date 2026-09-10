'use client';

import { ChevronRight, Copy, Pencil, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { filterSupplies } from '@/lib/analytics';
import { LOCATIONS, ORGANIZATIONS } from '@/lib/config';
import { formatDateTime } from '@/lib/date';
import type { FilterState, Supply } from '@/lib/types';
import { EmptyState, LoadingState, Modal } from './controls';
import { DEFAULT_FILTERS, Filters } from './Filters';

export function HistoryView({
  supplies,
  loading,
  deleting,
  onEdit,
  onDelete,
  onDuplicate,
}: {
  supplies: Supply[];
  loading: boolean;
  deleting: boolean;
  onEdit: (supply: Supply) => void;
  onDelete: (supply: Supply) => Promise<void>;
  onDuplicate: (supply: Supply) => void;
}) {
  const [filters, setFilters] = useState<FilterState>({
    ...DEFAULT_FILTERS,
    period: 'all',
  });
  const [selected, setSelected] = useState<Supply | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supply | null>(null);
  const visible = useMemo(
    () => filterSupplies(supplies, filters, true),
    [supplies, filters],
  );

  return (
    <section>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-300">
          Архив операций
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          История поставок
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {visible.length} записей по выбранным условиям
        </p>
      </div>
      <Filters value={filters} onChange={setFilters} withSearch />
      <div className="mt-5">
        {loading ? (
          <LoadingState />
        ) : !visible.length ? (
          <EmptyState
            title="Записей не найдено"
            description="Измените фильтры или создайте первую поставку на главной странице."
          />
        ) : (
          <div className="grid gap-3">
            {visible.map((supply) => {
              const active = ORGANIZATIONS.filter(
                (org) => (supply.organizations[org.id] ?? 0) > 0,
              );
              return (
                <button
                  key={supply.id}
                  onClick={() => setSelected(supply)}
                  className="group grid w-full gap-4 rounded-2xl border border-white/8 bg-[#0b1827] p-4 text-left transition hover:border-cyan-300/25 hover:bg-[#0e1d2e] sm:grid-cols-[150px_1fr_auto] sm:items-center sm:p-5"
                >
                  <div>
                    <span className="inline-flex rounded-lg border border-cyan-300/15 bg-cyan-300/8 px-2.5 py-1 text-xs font-semibold text-cyan-200">
                      {LOCATIONS[supply.location]}
                    </span>
                    <p className="mt-2 text-sm text-slate-300">
                      {formatDateTime(supply.eventAt)}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
                      <p className="text-lg font-semibold text-white">
                        {supply.total}{' '}
                        <span className="text-sm font-normal text-slate-500">
                          сотрудников
                        </span>
                      </p>
                      <p className="text-sm text-slate-500">
                        Организаций: {active.length}
                      </p>
                    </div>
                    <p className="mt-2 truncate text-sm text-slate-400">
                      {active
                        .slice(0, 4)
                        .map(
                          (org) =>
                            `${org.shortName} — ${supply.organizations[org.id]}`,
                        )
                        .join(' · ') || 'Все значения равны нулю'}
                    </p>
                    {supply.comment && (
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {supply.comment}
                      </p>
                    )}
                  </div>
                  <ChevronRight
                    size={20}
                    className="hidden text-slate-600 transition group-hover:translate-x-1 group-hover:text-cyan-300 sm:block"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <Modal
          title={`${LOCATIONS[selected.location]} · ${formatDateTime(selected.eventAt)}`}
          subtitle={`Версия записи: ${selected.revision}`}
          onClose={() => setSelected(null)}
        >
          <div className="p-5 sm:p-6">
            <div className="grid gap-2 sm:grid-cols-2">
              {ORGANIZATIONS.map((org) => (
                <div
                  key={org.id}
                  className={`flex justify-between rounded-xl px-4 py-3 text-sm ${(selected.organizations[org.id] ?? 0) ? 'bg-white/[.045]' : 'bg-white/[.02] opacity-55'}`}
                >
                  <span className="text-slate-300">{org.name}</span>
                  <strong className="tabular-nums text-white">
                    {selected.organizations[org.id] ?? 0}
                  </strong>
                </div>
              ))}
            </div>
            {selected.comment && (
              <div className="mt-4 rounded-xl border border-white/8 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Комментарий
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">
                  {selected.comment}
                </p>
              </div>
            )}
            <div className="mt-5 flex flex-col gap-3 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-sm text-slate-400">Всего</span>
                <strong className="ml-3 text-2xl tabular-nums text-white">
                  {selected.total}
                </strong>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    onDuplicate(selected);
                    setSelected(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300"
                >
                  <Copy size={15} />
                  Дублировать
                </button>
                <button
                  onClick={() => {
                    onEdit(selected);
                    setSelected(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300"
                >
                  <Pencil size={15} />
                  Изменить
                </button>
                <button
                  onClick={() => {
                    setDeleteTarget(selected);
                    setSelected(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-400/5 px-4 py-2.5 text-sm text-rose-200"
                >
                  <Trash2 size={15} />
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Modal
          danger
          title={`Удалить поставку от ${formatDateTime(deleteTarget.eventAt)}?`}
          subtitle="Это действие нельзя отменить."
          onClose={() => setDeleteTarget(null)}
        >
          <div className="flex justify-end gap-2 p-5 sm:p-6">
            <button
              onClick={() => setDeleteTarget(null)}
              className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300"
            >
              Отмена
            </button>
            <button
              disabled={deleting}
              onClick={async () => {
                try {
                  await onDelete(deleteTarget);
                  setDeleteTarget(null);
                } catch {
                  // Сообщение уже показано на уровне приложения.
                }
              }}
              className="rounded-xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {deleting ? 'Удаляем…' : 'Удалить'}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
