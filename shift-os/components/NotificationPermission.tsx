'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

function urlBase64ToArrayBuffer(value: string): ArrayBuffer {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let index = 0; index < rawData.length; index += 1) output[index] = rawData.charCodeAt(index);
  return output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength);
}

export default function NotificationPermission() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') setShowPrompt(true);
  }, []);

  async function enableNotifications() {
    setMessage('');
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setMessage('Notifications are not available on this device yet.');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;
    const registration = await navigator.serviceWorker.register('/sw.js');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToArrayBuffer(publicKey)
    });
    const subscriptionJson = subscription.toJSON();
    const supabase = createClient();
    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (!session || !subscriptionJson.endpoint || !subscriptionJson.keys?.p256dh || !subscriptionJson.keys?.auth) return;
    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: session.user.id,
      endpoint: subscriptionJson.endpoint,
      p256dh: subscriptionJson.keys.p256dh,
      auth: subscriptionJson.keys.auth
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    setShowPrompt(false);
  }

  if (!showPrompt) return null;

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="font-semibold text-white">Enable notifications to get availability alerts</p>
      <button type="button" onClick={enableNotifications} className="mt-3 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">Allow notifications</button>
      {message ? <p className="mt-2 text-sm text-white/40">{message}</p> : null}
    </section>
  );
}
