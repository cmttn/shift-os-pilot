'use client';

import { useEffect, useState } from 'react';

const DISMISS_KEY = 'notifications-dismissed';

function urlBase64ToArrayBuffer(value: string): ArrayBuffer {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let index = 0; index < rawData.length; index += 1) {
    output[index] = rawData.charCodeAt(index);
  }
  return output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength);
}

export default function NotificationPermission() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = window.localStorage.getItem(DISMISS_KEY) === 'true';
    if (dismissed || !('Notification' in window) || Notification.permission === 'granted') {
      setVisible(false);
      return;
    }
    setVisible(true);
  }, []);

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, 'true');
    setVisible(false);
  }

  async function subscribeToPush() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    await navigator.serviceWorker.register('/sw.js');
    const registration = await navigator.serviceWorker.ready;
    const existingSubscription = await registration.pushManager.getSubscription();
    const subscription = existingSubscription ?? await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToArrayBuffer(publicKey)
    });

    await fetch('/api/push-subscription', {
      method: 'POST',
      body: JSON.stringify(subscription),
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async function handleAllow() {
    if (!('Notification' in window)) {
      dismiss();
      return;
    }

    if (Notification.permission === 'granted') {
      dismiss();
      return;
    }

    if (Notification.permission === 'denied') {
      dismiss();
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await subscribeToPush();
    }
    dismiss();
  }

  if (!visible) return null;

  return (
    <section className="fixed inset-x-0 bottom-16 z-40 flex h-12 items-center gap-3 border-b px-4 md:bottom-auto md:left-[260px] md:top-0" style={{ backgroundColor: 'rgba(0,200,81,0.08)', borderColor: 'rgba(0,200,81,0.15)' }}>
      <span className="text-sm" aria-hidden="true">🔔</span>
      <p className="min-w-0 flex-1 truncate text-sm text-white/70">Enable notifications to get availability alerts</p>
      <button type="button" onClick={handleAllow} className="rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-300 ease-out hover:bg-white/[0.04]" style={{ borderColor: 'rgba(0,200,81,0.4)', color: '#00C851' }}>
        Allow
      </button>
      <button type="button" onClick={dismiss} className="text-xs text-white/30 transition-all duration-300 ease-out hover:text-white/60" aria-label="Dismiss notifications prompt">
        ✕
      </button>
    </section>
  );
}
