import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { UndoBannerProvider } from '@/components/undo-banner';
import { DATABASE_NAME, migrateDbIfNeeded } from '@/data/schema';
import { seedIfEmpty } from '@/data/seed';

SplashScreen.preventAutoHideAsync();

async function initializeDatabase(db: SQLiteDatabase) {
  await migrateDbIfNeeded(db);
  await seedIfEmpty(db);
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={initializeDatabase}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <UndoBannerProvider>
          <AnimatedSplashOverlay />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="item/[id]" options={{ title: 'Item' }} />
            <Stack.Screen name="item/new" options={{ presentation: 'modal', title: 'Add Item' }} />
            <Stack.Screen name="item/[id]/edit" options={{ presentation: 'modal', title: 'Edit Item' }} />
          </Stack>
        </UndoBannerProvider>
      </ThemeProvider>
    </SQLiteProvider>
  );
}
