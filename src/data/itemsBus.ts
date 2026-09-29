type Listener = () => void;

const listeners = new Set<Listener>();

/** Lets screens react to item mutations that happen while they're already mounted (e.g. an Undo tap), not just on focus. */
export function notifyItemsChanged(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeItemsChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
