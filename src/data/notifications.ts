import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

import type { Item } from '@/types/item';

import { isFinished, upcomingReminderDates } from './reminderSchedule';

// expo-notifications throws on import (not just on push-token use) when
// running in Expo Go on Android, because SDK 53 dropped push support there —
// see expo-notifications/src/warnOfExpoGoPushUsage.ts. Local notifications
// need a dev/production build on Android; iOS Expo Go is unaffected. Import
// lazily and only on platforms/environments where it won't crash on load.
type NotificationsModule = typeof import('expo-notifications');
const NOTIFICATIONS_AVAILABLE = !(Platform.OS === 'android' && isRunningInExpoGo());
const Notifications: NotificationsModule | null = NOTIFICATIONS_AVAILABLE
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports -- must be a lazy require, not a static import, so the crashing module body only runs when NOTIFICATIONS_AVAILABLE
    (require('expo-notifications') as NotificationsModule)
  : null;

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

const ANDROID_CHANNEL_ID = 'default';
let androidChannelReady: Promise<void> | null = null;

function ensureAndroidChannel(): Promise<void> {
  if (!Notifications || Platform.OS !== 'android') return Promise.resolve();
  if (!androidChannelReady) {
    androidChannelReady = Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    }).then(() => undefined);
  }
  return androidChannelReady;
}

async function ensurePermission(): Promise<boolean> {
  if (!Notifications) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function cancelRemindersForItem(itemId: string): Promise<void> {
  if (!Notifications) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled.filter((notification) => notification.content.data?.itemId === itemId);
  await Promise.all(
    toCancel.map((notification) => Notifications.cancelScheduledNotificationAsync(notification.identifier))
  );
}

/** Cancels any existing reminders for this item and schedules fresh ones from its current due date/repeat/offsets. */
export async function scheduleRemindersForItem(item: Item): Promise<void> {
  if (!Notifications) return;
  await cancelRemindersForItem(item.id);

  if (isFinished(item)) return;

  const granted = await ensurePermission();
  if (!granted) return;

  await ensureAndroidChannel();

  const dates = upcomingReminderDates(item);
  await Promise.all(
    dates.map((date) =>
      Notifications!.scheduleNotificationAsync({
        content: {
          title: item.title,
          body: `Due ${item.dueDate}`,
          data: { itemId: item.id },
        },
        trigger: {
          type: Notifications!.SchedulableTriggerInputTypes.DATE,
          date,
          channelId: Platform.OS === 'android' ? ANDROID_CHANNEL_ID : undefined,
        },
      })
    )
  );
}
