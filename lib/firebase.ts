import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import type { Supply, SupplyDraft } from "./types";

// Эти публичные значения копируются из Firebase Console → Project settings → Your apps.
// Firebase Web API key не является секретом. Секреты и service-account JSON сюда помещать нельзя.
export const firebaseConfig = {
  apiKey: "AIzaSyCkzE2R5vAJe6R1OxLA_--5efk19EuIfM0",
  authDomain: "supply-control-4bd40.firebaseapp.com",
  projectId: "supply-control-4bd40",
  storageBucket: "supply-control-4bd40.firebasestorage.app",
  messagingSenderId: "68018699503",
  appId: "1:68018699503:web:71dd3f07cad9a871bfef1a",
};

// Оставьте пустым до настройки App Check. После регистрации reCAPTCHA Enterprise вставьте site key.
export const appCheckSiteKey = "";
export const isFirebaseConfigured = !Object.values(firebaseConfig).some((value) =>
  value.startsWith("REPLACE_"),
);

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
if (app && appCheckSiteKey && typeof window !== "undefined") {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}
const db = app ? getFirestore(app) : null;

function friendlyError(error: unknown): Error {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  if (code.includes("permission-denied"))
    return new Error("Firestore отклонил запрос. Проверьте Security Rules и App Check.");
  if (code.includes("unavailable"))
    return new Error("Firebase сейчас недоступен. Проверьте интернет и повторите попытку.");
  if (code.includes("failed-precondition"))
    return new Error(
      "Для запроса требуется индекс Firestore. Откройте ссылку из консоли браузера и создайте индекс.",
    );
  return error instanceof Error ? error : new Error("Неизвестная ошибка Firebase.");
}

function requireDb() {
  if (!db)
    throw new Error("Firebase ещё не подключён. Заполните firebaseConfig в lib/firebase.ts.");
  return db;
}

function mapSupply(id: string, data: Record<string, unknown>): Supply {
  const asDate = (value: unknown) =>
    value instanceof Timestamp ? value.toDate() : value instanceof Date ? value : null;
  return {
    id,
    location: data.location as Supply["location"],
    recipient: typeof data.recipient === "string" ? data.recipient : "",
    status:
      data.status === "DELIVERED" || data.status === "NOT_DELIVERED" ? data.status : "UNKNOWN",
    eventAt: asDate(data.eventAt) ?? new Date(),
    comment: typeof data.comment === "string" ? data.comment : "",
    organizations: (data.organizations ?? {}) as Record<string, number>,
    total: typeof data.total === "number" ? data.total : 0,
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
    revision: typeof data.revision === "number" ? data.revision : 1,
  };
}

export function subscribeToSupplies(
  onData: (supplies: Supply[]) => void,
  onError: (error: Error) => void,
) {
  if (!db) {
    onData([]);
    return () => undefined;
  }
  const suppliesQuery = query(collection(db, "supplies"), orderBy("eventAt", "desc"), limit(2000));
  return onSnapshot(
    suppliesQuery,
    (snapshot) => onData(snapshot.docs.map((item) => mapSupply(item.id, item.data()))),
    (error) => onError(friendlyError(error)),
  );
}

export async function createSupply(draft: SupplyDraft) {
  try {
    const total = Object.values(draft.organizations).reduce((sum, value) => sum + value, 0);
    return await addDoc(collection(requireDb(), "supplies"), {
      ...draft,
      total,
      revision: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw friendlyError(error);
  }
}

export async function updateSupply(id: string, draft: SupplyDraft, expectedRevision: number) {
  try {
    const database = requireDb();
    const ref = doc(database, "supplies", id);
    await runTransaction(database, async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) throw new Error("Поставка уже удалена другим пользователем.");
      const currentRevision = Number(snapshot.data().revision ?? 1);
      if (currentRevision !== expectedRevision)
        throw new Error(
          "Запись уже изменена на другом устройстве. Закройте окно и откройте поставку заново.",
        );
      const total = Object.values(draft.organizations).reduce((sum, value) => sum + value, 0);
      transaction.update(ref, {
        ...draft,
        total,
        revision: currentRevision + 1,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    throw friendlyError(error);
  }
}

export async function removeSupply(id: string) {
  try {
    await deleteDoc(doc(requireDb(), "supplies", id));
  } catch (error) {
    throw friendlyError(error);
  }
}

export async function readSupply(id: string) {
  const snapshot = await getDoc(doc(requireDb(), "supplies", id));
  return snapshot.exists() ? mapSupply(snapshot.id, snapshot.data()) : null;
}
