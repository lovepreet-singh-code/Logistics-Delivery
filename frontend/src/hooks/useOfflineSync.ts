import { useEffect, useCallback } from 'react';
import localforage from 'localforage';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export interface OfflineAction {
  id: string;
  url: string;
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  payload: any;
  timestamp: number;
}

export function useOfflineSync() {
  const handleSync = useCallback(async () => {
    try {
      const queue: OfflineAction[] = await localforage.getItem('offline_sync_queue') || [];
      if (!queue || queue.length === 0) return;

      toast('Network restored. Synchronizing offline actions...', { icon: '🔄' });
      const token = localStorage.getItem('token');
      const remainingQueue: OfflineAction[] = [];

      let hasSuccess = false;

      for (const action of queue) {
        try {
          // Attempt the API request
          await axios({
            method: action.method,
            url: action.url,
            data: action.payload,
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          hasSuccess = true;
        } catch (error: any) {
          console.error(`Failed to sync action ${action.id}:`, error);
          // Only keep in queue if it's a network error (like 5xx or offline)
          // If it's a 4xx error (validation, etc), it might be permanently invalid, but we'll drop it or handle it separately to avoid infinite loops.
          if (!error.response || error.response.status >= 500) {
             remainingQueue.push(action);
          }
        }
      }

      await localforage.setItem('offline_sync_queue', remainingQueue);

      if (hasSuccess && remainingQueue.length === 0) {
        toast.success('Network restored. All offline actions synchronized! 🟢');
      } else if (remainingQueue.length > 0) {
        toast.error(`${remainingQueue.length} actions failed to sync. Will retry later.`);
      }

    } catch (error) {
      console.error('Error during offline sync process:', error);
    }
  }, []);

  useEffect(() => {
    // Listen for online events
    window.addEventListener('online', handleSync);

    // Also attempt sync on mount if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      handleSync();
    }

    return () => {
      window.removeEventListener('online', handleSync);
    };
  }, [handleSync]);
}
