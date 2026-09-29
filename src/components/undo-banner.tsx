import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';

type UndoRequest = {
  message: string;
  onUndo: () => void;
};

type UndoContextValue = {
  showUndo: (request: UndoRequest) => void;
};

const UndoContext = createContext<UndoContextValue | null>(null);

const AUTO_DISMISS_MS = 5000;

export function UndoBannerProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<UndoRequest | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showUndo = useCallback((request: UndoRequest) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPending(request);
    timerRef.current = setTimeout(() => setPending(null), AUTO_DISMISS_MS);
  }, []);

  const handleUndo = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    pending?.onUndo();
    setPending(null);
  };

  return (
    <UndoContext.Provider value={{ showUndo }}>
      {children}
      {pending && (
        <ThemedView type="backgroundSelected" style={styles.banner}>
          <ThemedText type="small" style={styles.message} numberOfLines={2}>
            {pending.message}
          </ThemedText>
          <Pressable onPress={handleUndo} hitSlop={8}>
            <ThemedText type="linkPrimary">Undo</ThemedText>
          </Pressable>
        </ThemedView>
      )}
    </UndoContext.Provider>
  );
}

export function useUndoBanner(): UndoContextValue {
  const ctx = useContext(UndoContext);
  if (!ctx) {
    throw new Error('useUndoBanner must be used within an UndoBannerProvider');
  }
  return ctx;
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: Spacing.four,
    right: Spacing.four,
    bottom: BottomTabInset + Spacing.four,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  message: {
    flex: 1,
  },
});
