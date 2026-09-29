import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Item } from '@/types/item';

import { isFinished, upcomingReminderDates } from './reminderSchedule';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const ANDROID_CHANNEL_ID = 'default';
let androidChannelReady: Promise<void> | null = null;

function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return Promise.resolve();
  if (!androidChannelReady) {
    androidChannelReady = Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    }).then(() => undefined);
  }
  return androidChannelReady;
}

async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function cancelRemindersForItem(itemId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled.filter((notification) => notification.content.data?.itemId === itemId);
  await Promise.all(
    toCancel.map((notification) => Notifications.cancelScheduledNotificationAsync(notification.identifier))
  );
}

/** Cancels any existing reminders for this item and schedules fresh ones from its current due date/repeat/offsets. */
export async function scheduleRemindersForItem(item: Item): Promise<void> {
  await cancelRemindersForItem(item.id);

  if (isFinished(item)) return;

  const granted = await ensurePermission();
  if (!granted) return;

  await ensureAndroidChannel();

  const dates = upcomingReminderDates(item);
  await Promise.all(
    dates.map((date) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: item.title,
          body: `Due ${item.dueDate}`,
          data: { itemId: item.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date,
          channelId: Platform.OS === 'android' ? ANDROID_CHANNEL_ID : undefined,
        },
      })
    )
  );
}
