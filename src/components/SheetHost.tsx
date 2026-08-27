import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, View } from 'react-native';

type Host = {
  /** Publishes (or clears, with null) this caller's overlay. */
  mount: (id: string, node: ReactNode | null) => void;
};

const SheetHostContext = createContext<Host | null>(null);

/**
 * A single place, above everything else in the shell, where overlays are painted.
 *
 * Needed because the tab bar and the wordmark are pinned at `zIndex: 2` in `AppShell`, above
 * every screen — so a sheet rendered inside a screen paints *under* the tab bar, and no zIndex
 * on the sheet can fix that: its screen's stacking context caps it. Sheets therefore hand
 * their content up to this host, which sits above the bars as a sibling of them.
 *
 * This is only load-bearing on web; native sheets use a real `Modal`, which escapes the tree
 * on its own. Routing both through the same host keeps one code path.
 */
export function SheetHostProvider({ children }: { children: ReactNode }) {
  const [nodes, setNodes] = useState<Record<string, ReactNode>>({});

  const mount = useCallback((id: string, node: ReactNode | null) => {
    setNodes((current) => {
      if (node === null) {
        if (!(id in current)) return current;
        const next = { ...current };
        delete next[id];
        return next;
      }
      return { ...current, [id]: node };
    });
  }, []);

  const value = useMemo(() => ({ mount }), [mount]);
  const mounted = Object.entries(nodes);

  return (
    <SheetHostContext.Provider value={value}>
      {children}
      {mounted.length > 0 && (
        // box-none so the areas either side of a sheet stay tappable by its own backdrop
        // rather than by this wrapper.
        <View style={styles.host} pointerEvents="box-none">
          {mounted.map(([id, node]) => (
            <View key={id} style={StyleSheet.absoluteFill} pointerEvents="box-none">
              {node}
            </View>
          ))}
        </View>
      )}
    </SheetHostContext.Provider>
  );
}

/**
 * Renders `children` into the host instead of in place. A no-op passthrough when there is no
 * host above it, so a screen rendered outside the shell — a test, a storybook — still works.
 */
export function SheetPortal({ children }: { children: ReactNode }) {
  const host = useContext(SheetHostContext);
  const id = useId();

  useEffect(() => {
    if (!host) return;
    host.mount(id, children);
    return () => host.mount(id, null);
  }, [host, id, children]);

  return host ? null : <>{children}</>;
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Above the pinned wordmark and tab bar, which sit at 2.
    zIndex: 3,
  },
});
