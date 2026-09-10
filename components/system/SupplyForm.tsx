'use client';

import { CalendarDays, Clock3, Minus, Plus, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  LOCATIONS,
  MAX_COUNT_PER_ORGANIZATION,
  ORGANIZATIONS,
} from '@/lib/config';
import { fromMoscowInput, toMoscowInput } from '@/lib/date';
import type { LocationCode, Supply, SupplyDraft } from '@/lib/types';
import { Modal } from './controls';

function initialForm(supply?: Supply | null, template?: Supply | null) {
  const input = toMoscowInput(supply?.eventAt);
  return {
    location: supply?.location ?? template?.location ?? ('ZMH' as LocationCode),
    date: input.date,
    time: input.time,
    comment: supply?.comment ?? '',
    organizations: Object.fromEntries(
      ORGANIZATIONS.map((org) => [
        org.id,
        supply?.organizations[org.id] ?? template?.organizations[org.id] ?? 0,
      ]),
    ),
  };
}

export function SupplyForm({
  supply,
  template,
  lastSupply,
  saving,
  onSave,
  onCancel,
  embedded = false,
}: {
  supply?: Supply | null;
  template?: Supply | null;
  lastSupply?: Supply | null;
  saving: boolean;
  onSave: (draft: SupplyDraft) => Promise<void>;
  onCancel?: () => void;
  embedded?: boolean;
}) {
  const [form, setForm] = useState(() => initialForm(supply, template));
  const [confirming, setConfirming] = useState(false);
  const total = useMemo(
    () =>
      Object.values(form.organizations).reduce((sum, value) => sum + value, 0),
    [form.organizations],
  );
  const active = ORGANIZATIONS.filter((org) => form.organizations[org.id] > 0);

  function setCount(id: string, next: number) {
    setForm((current) => ({
      ...current,
      organizations: {
        ...current.organizations,
        [id]: Math.max(
          0,
          Math.min(
            MAX_COUNT_PER_ORGANIZATION,
            Number.isFinite(next) ? Math.round(next) : 0,
          ),
        ),
      },
    }));
  }
  function reset() {
    setForm((current) => ({
      ...current,
      organizations: Object.fromEntries(
        ORGANIZATIONS.map((org) => [org.id, 0]),
      ),
      comment: '',
    }));
  }
  function repeatLast() {
    if (lastSupply)
      setForm((current) => ({
        ...current,
        location: lastSupply.location,
        organizations: Object.fromEntries(
          ORGANIZATIONS.map((org) => [
            org.id,
            lastSupply.organizations[org.id] ?? 0,
          ]),
        ),
        comment: '',
      }));
  }
  const draft = (): SupplyDraft => ({
    location: form.location,
    eventAt: fromMoscowInput(form.date, form.time),
    comment: form.comment.trim(),
    organizations: form.organizations,
  });

  return (
    <>
      <div className={supply || embedded ? 'p-5 sm:p-6' : ''}>
        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          {!supply && !embedded && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-cyan-300">
                Оперативная форма
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Учёт поставки
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                Выберите место и зафиксируйте присутствующий состав.
              </p>
            </div>
          )}
          <div
            className={`grid grid-cols-2 rounded-2xl border border-white/10 bg-[#0d1a2a] p-1.5 ${supply ? 'lg:col-start-1' : ''}`}
          >
            {(['ZMH', 'MS'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setForm((current) => ({ ...current, location: value }))
                }
                className={`min-w-28 rounded-xl px-5 py-3 text-sm font-semibold transition ${form.location === value ? 'bg-cyan-300 text-[#07111e]' : 'text-slate-400 hover:text-white'}`}
              >
                {LOCATIONS[value]}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <label className="relative">
            <CalendarDays
              size={17}
              className="pointer-events-none absolute left-3 top-3.5 text-slate-500"
            />
            <input
              aria-label="Дата поставки"
              required
              type="date"
              value={form.date}
              onChange={(event) =>
                setForm({ ...form, date: event.target.value })
              }
              className="h-11 w-full rounded-xl border border-white/10 bg-[#0a1726] pl-10 pr-3 text-sm text-slate-200 outline-none focus:border-cyan-300/50"
            />
          </label>
          <label className="relative">
            <Clock3
              size={17}
              className="pointer-events-none absolute left-3 top-3.5 text-slate-500"
            />
            <input
              aria-label="Время поставки"
              required
              type="time"
              value={form.time}
              onChange={(event) =>
                setForm({ ...form, time: event.target.value })
              }
              className="h-11 w-full rounded-xl border border-white/10 bg-[#0a1726] pl-10 pr-3 text-sm text-slate-200 outline-none focus:border-cyan-300/50"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {ORGANIZATIONS.map((org, index) => {
            const value = form.organizations[org.id];
            return (
              <article
                key={org.id}
                className={`rounded-2xl border p-4 transition ${value ? 'border-cyan-300/20 bg-[#0f1e2f]' : 'border-white/8 bg-[#0c1827] opacity-75'}`}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-500">
                      {String(index + 1).padStart(2, '0')}
                    </p>
                    <h2 className="mt-1 min-h-10 font-medium text-slate-100">
                      {org.name}
                    </h2>
                  </div>
                  <span
                    className={`mt-1 size-2 rounded-full ${value ? 'bg-cyan-300' : 'bg-slate-700'}`}
                  />
                </div>
                <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Уменьшить ${org.name}`}
                    onClick={() => setCount(org.id, value - 1)}
                    className="grid size-11 place-items-center rounded-xl border border-white/10 bg-white/[.03] text-slate-300 hover:border-cyan-300/30 hover:text-cyan-200"
                  >
                    <Minus size={18} />
                  </button>
                  <input
                    aria-label={`Количество ${org.name}`}
                    className="h-11 min-w-0 rounded-xl border border-white/10 bg-[#071321] text-center text-xl font-semibold tabular-nums text-white outline-none focus:border-cyan-300/60"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max={MAX_COUNT_PER_ORGANIZATION}
                    value={value}
                    onFocus={(event) => event.currentTarget.select()}
                    onChange={(event) =>
                      setCount(org.id, Number(event.target.value))
                    }
                  />
                  <button
                    type="button"
                    aria-label={`Увеличить ${org.name}`}
                    onClick={() => setCount(org.id, value + 1)}
                    className="grid size-11 place-items-center rounded-xl bg-cyan-300 text-[#07111e] hover:bg-cyan-200"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <label className="mt-4 block">
          <span className="mb-2 block text-xs text-slate-500">
            Комментарий или примечание
          </span>
          <textarea
            maxLength={1000}
            rows={3}
            value={form.comment}
            onChange={(event) =>
              setForm({ ...form, comment: event.target.value })
            }
            placeholder="Необязательно"
            className="w-full resize-y rounded-xl border border-white/10 bg-[#0a1726] px-4 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-300/50"
          />
        </label>

        <div
          className={`${supply ? '' : 'sticky bottom-4'} mt-5 flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#091626]/95 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-5`}
        >
          <div>
            <p className="text-xs uppercase tracking-[.16em] text-slate-500">
              Всего сотрудников
            </p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-white">
              {total}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300 hover:text-white"
            >
              <RotateCcw size={16} />
              Обнулить
            </button>
            {!supply && lastSupply && (
              <button
                type="button"
                onClick={repeatLast}
                className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300 hover:text-white"
              >
                Повторить предыдущую
              </button>
            )}
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300"
              >
                Отмена
              </button>
            )}
            <button
              type="button"
              disabled={saving || !form.date || !form.time}
              onClick={() => setConfirming(true)}
              className="rounded-xl bg-cyan-300 px-6 py-3 text-sm font-bold text-[#07111e] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {supply ? 'Сохранить изменения' : 'Сохранить поставку'}
            </button>
          </div>
        </div>
      </div>

      {confirming && (
        <Modal
          title={supply ? 'Сохранить изменения?' : 'Подтвердите поставку'}
          subtitle={`${LOCATIONS[form.location]} · ${form.date} · ${form.time}`}
          onClose={() => setConfirming(false)}
        >
          <div className="p-5 sm:p-6">
            <div className="grid gap-2 sm:grid-cols-2">
              {active.length ? (
                active.map((org) => (
                  <div
                    key={org.id}
                    className="flex justify-between rounded-xl bg-white/[.035] px-4 py-3 text-sm"
                  >
                    <span className="text-slate-300">{org.name}</span>
                    <strong className="tabular-nums text-white">
                      {form.organizations[org.id]}
                    </strong>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">
                  Все значения равны нулю.
                </p>
              )}
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-5">
              <div>
                <span className="text-sm text-slate-400">Всего</span>
                <strong className="ml-3 text-2xl tabular-nums text-white">
                  {total}
                </strong>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirming(false)}
                  className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300"
                >
                  Отмена
                </button>
                <button
                  disabled={saving}
                  onClick={async () => {
                    try {
                      await onSave(draft());
                      setConfirming(false);
                    } catch {
                      // Сообщение уже показано на уровне приложения.
                    }
                  }}
                  className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-bold text-[#07111e] disabled:opacity-50"
                >
                  {saving ? 'Сохраняем…' : 'Сохранить'}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
