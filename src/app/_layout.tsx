import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { UndoBannerProvider } from '@/components/undo-banner';
import { runAutoBackupIfDue } from '@/data/backup';
import { DATABASE_NAME, migrateDbIfNeeded } from '@/data/schema';

SplashScreen.preventAutoHideAsync();

// Fire-and-forget: doesn't block the splash screen/first render on the
// backup file write, and only actually does anything about once a week.
function AutoBackupRunner() {
  const db = useSQLiteContext();
  useEffect(() => {
    runAutoBackupIfDue(db);
  }, [db]);
  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <UndoBannerProvider>
          <AnimatedSplashOverlay />
          <AutoBackupRunner />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="item/[id]" options={{ title: 'Item' }} />
            <Stack.Screen name="item/new" options={{ presentation: 'modal', title: 'Add Item' }} />
            <Stack.Screen name="item/[id]/edit" options={{ presentation: 'modal', title: 'Edit Item' }} />
            <Stack.Screen name="category/[key]" options={{ title: 'Category' }} />
          </Stack>
        </UndoBannerProvider>
      </ThemeProvider>
    </SQLiteProvider>
  );
}
