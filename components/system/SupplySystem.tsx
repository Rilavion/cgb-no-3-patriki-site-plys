'use client';

import {
  BarChart3,
  ClipboardList,
  History,
  ShieldCheck,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  createSupply,
  isFirebaseConfigured,
  removeSupply,
  subscribeToSupplies,
  updateSupply,
} from '@/lib/firebase';
import type { Supply, SupplyDraft } from '@/lib/types';
import { LoadingState, Modal, StatusBanner } from './controls';
import { HistoryView } from './HistoryView';
import { SupplyForm } from './SupplyForm';

const StatsView = lazy(() =>
  import('./StatsView').then((module) => ({ default: module.StatsView })),
);

type Page = 'current' | 'history' | 'stats';
type Notice = { message: string; tone: 'info' | 'success' | 'error' } | null;

export function SupplySystem() {
  const [page, setPage] = useState<Page>('current');
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [notice, setNotice] = useState<Notice>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState<Supply | null>(null);
  const [duplicate, setDuplicate] = useState<Supply | null>(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    const unsubscribe = subscribeToSupplies(
      (data) => {
        setSupplies(data);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        setNotice({ message: error.message, tone: 'error' });
      },
    );
    return () => {
      unsubscribe();
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(id);
  }, [notice]);
  const lastSupply = useMemo(() => supplies[0] ?? null, [supplies]);

  async function handleCreate(draft: SupplyDraft) {
    setSaving(true);
    try {
      await createSupply(draft);
      setNotice({
        message: 'Поставка сохранена и уже учитывается в статистике.',
        tone: 'success',
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : 'Не удалось сохранить поставку.',
        tone: 'error',
      });
      throw error;
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(draft: SupplyDraft) {
    if (!editing) return;
    setSaving(true);
    try {
      await updateSupply(editing.id, draft, editing.revision);
      setEditing(null);
      setNotice({ message: 'Изменения сохранены.', tone: 'success' });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : 'Не удалось обновить поставку.',
        tone: 'error',
      });
      throw error;
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(supply: Supply) {
    setDeleting(true);
    try {
      await removeSupply(supply.id);
      setNotice({ message: 'Поставка удалена.', tone: 'success' });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : 'Не удалось удалить поставку.',
        tone: 'error',
      });
      throw error;
    } finally {
      setDeleting(false);
    }
  }

  const nav = [
    {
      id: 'current' as const,
      label: 'Текущая поставка',
      short: 'Учёт',
      icon: ClipboardList,
    },
    {
      id: 'history' as const,
      label: 'История',
      short: 'История',
      icon: History,
    },
    {
      id: 'stats' as const,
      label: 'Статистика',
      short: 'Статистика',
      icon: BarChart3,
    },
  ];

  return (
    <main className="min-h-screen pb-24 text-[var(--foreground)] sm:pb-0">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#08121f]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <button
            onClick={() => setPage('current')}
            className="flex items-center gap-3 text-left"
          >
            <div className="grid size-10 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/8 text-cyan-300">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-white">
                Учёт поставок
              </p>
              <p className="text-xs text-slate-500">Оперативный мониторинг</p>
            </div>
          </button>
          <nav className="hidden items-center gap-1 rounded-xl border border-white/8 bg-white/[.025] p-1 text-sm sm:flex">
            {nav.map((item) => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`rounded-lg px-4 py-2 transition ${page === item.id ? 'bg-cyan-300/10 text-cyan-200' : 'text-slate-400 hover:text-white'}`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div
            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ${online ? 'text-emerald-300' : 'bg-rose-400/8 text-rose-200'}`}
          >
            {online ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span className="hidden md:inline">
              {online ? 'В сети' : 'Нет сети'}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:py-10">
        <div className="mb-5 grid gap-3">
          {!isFirebaseConfigured && (
            <StatusBanner>
              Демонстрация интерфейса. Чтобы сохранять данные, заполните{' '}
              <code className="rounded bg-black/20 px-1.5 py-0.5">
                firebaseConfig
              </code>{' '}
              по инструкции в README.
            </StatusBanner>
          )}
          {!online && (
            <StatusBanner tone="error">
              Интернет-соединение потеряно. Не закрывайте страницу во время
              сохранения; повторите действие после восстановления связи.
            </StatusBanner>
          )}
          {notice && (
            <StatusBanner tone={notice.tone}>
              {notice.tone === 'success' ? '✓ ' : ''}
              {notice.message}
            </StatusBanner>
          )}
        </div>
        {page === 'current' && (
          <SupplyForm
            key={supplies[0]?.id ?? 'new'}
            lastSupply={lastSupply}
            saving={saving}
            onSave={handleCreate}
          />
        )}
        {page === 'history' && (
          <HistoryView
            supplies={supplies}
            loading={loading}
            deleting={deleting}
            onEdit={setEditing}
            onDelete={handleDelete}
            onDuplicate={(supply) => {
              setDuplicate(supply);
              setPage('current');
            }}
          />
        )}
        {page === 'stats' && (
          <Suspense fallback={<LoadingState />}>
            <StatsView
              supplies={supplies}
              onStatus={(message, tone = 'success') =>
                setNotice({ message, tone })
              }
            />
          </Suspense>
        )}
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-3 rounded-2xl border border-white/10 bg-[#091626]/95 p-1.5 shadow-2xl backdrop-blur-xl sm:hidden">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`grid place-items-center gap-1 rounded-xl py-2 text-[11px] ${page === item.id ? 'bg-cyan-300/10 text-cyan-200' : 'text-slate-500'}`}
            >
              <Icon size={18} />
              {item.short}
            </button>
          );
        })}
      </nav>

      {editing && (
        <Modal
          title="Редактирование поставки"
          subtitle="Системная дата создания будет сохранена"
          onClose={() => setEditing(null)}
        >
          <SupplyForm
            supply={editing}
            saving={saving}
            onSave={handleUpdate}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
      {duplicate && (
        <Modal
          title="Дублировать поставку"
          subtitle="Создаётся новая независимая запись с текущими датой и временем"
          onClose={() => setDuplicate(null)}
        >
          <SupplyForm
            embedded
            template={duplicate}
            saving={saving}
            onSave={async (draft) => {
              await handleCreate(draft);
              setDuplicate(null);
            }}
            onCancel={() => setDuplicate(null)}
          />
        </Modal>
      )}
    </main>
  );
}
