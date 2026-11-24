import { SyncQueueItem } from '../types';

const QUEUE_KEY = 'mp_offline_sync_queue';

export function getOfflineSyncQueue(): SyncQueueItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveOfflineSyncQueue(queue: SyncQueueItem[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // ignore storage quota errors
  }
}

export function enqueueOfflineAction(params: {
  userId: string;
  actionType: string;
  pageOrFeature: string;
  endpoint: string;
  method?: 'POST' | 'PUT';
  payload: Record<string, any>;
}): SyncQueueItem {
  const queue = getOfflineSyncQueue();
  const item: SyncQueueItem = {
    clientMutationId: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    userId: params.userId,
    actionType: params.actionType,
    pageOrFeature: params.pageOrFeature,
    endpoint: params.endpoint,
    method: params.method || 'POST',
    payload: params.payload,
    createdAt: new Date().toISOString(),
    retries: 0,
  };
  queue.push(item);
  saveOfflineSyncQueue(queue);
  return item;
}

export async function flushOfflineSyncQueue(): Promise<{ synced: number; remaining: number }> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { synced: 0, remaining: getOfflineSyncQueue().length };
  }

  const queue = getOfflineSyncQueue();
  if (queue.length === 0) return { synced: 0, remaining: 0 };

  const remaining: SyncQueueItem[] = [];
  let synced = 0;

  for (const item of queue) {
    try {
      const res = await fetch(item.endpoint, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item.payload,
          clientMutationId: item.clientMutationId,
        }),
      });
      if (res.ok || res.status === 409) {
        // Also record idempotently in global memory
        await fetch('/api/memory/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: item.userId,
            clientMutationId: item.clientMutationId,
            actionType: item.actionType,
            pageOrFeature: item.pageOrFeature,
            data: { syncedFromOfflineQueue: true, createdAt: item.createdAt },
          }),
        }).catch(() => {});
        synced += 1;
      } else if (res.status !== 400 && res.status !== 404 && item.retries < 5) {
        remaining.push({ ...item, retries: item.retries + 1 });
      }
    } catch {
      if (item.retries < 5) {
        remaining.push({ ...item, retries: item.retries + 1 });
      }
    }
  }

  saveOfflineSyncQueue(remaining);
  return { synced, remaining: remaining.length };
}
