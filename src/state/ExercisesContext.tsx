import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { initialExercises, type Exercise, type ExerciseDefinition } from '../data/home';

type ExercisesValue = {
  exercises: Exercise[];
  /** Marks one done. Returns true if this call changed it, so callers can celebrate once. */
  complete: (key: string) => boolean;
  dismissAll: () => void;
  remove: (key: string) => void;
  reorder: (from: number, to: number) => void;
  add: (definition: ExerciseDefinition) => void;
};

const ExercisesContext = createContext<ExercisesValue | null>(null);

/**
 * Today's exercises live here rather than in HomeScreen because the edit screen
 * (7338:215283) mutates the same list — reordering, deleting and adding from the library.
 */
export function ExercisesProvider({ children }: { children: ReactNode }) {
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
  // A ref, not state: two adds in the same tick would otherwise read the same value
  // and mint duplicate keys.
  const nextKey = useRef(initialExercises.length + 1);

  const complete = useCallback((key: string) => {
    let changed = false;
    setExercises((current) =>
      current.map((exercise) => {
        if (exercise.key !== key || exercise.completed) return exercise;
        changed = true;
        return { ...exercise, completed: true };
      }),
    );
    return changed;
  }, []);

  const dismissAll = useCallback(() => setExercises([]), []);

  const remove = useCallback(
    (key: string) => setExercises((current) => current.filter((e) => e.key !== key)),
    [],
  );

  const reorder = useCallback((from: number, to: number) => {
    setExercises((current) => {
      if (from === to || from < 0 || to < 0 || from >= current.length || to >= current.length) {
        return current;
      }
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const add = useCallback((definition: ExerciseDefinition) => {
    const key = `today-${nextKey.current++}`;
    setExercises((current) => [...current, { ...definition, key, completed: false }]);
  }, []);

  const value = useMemo(
    () => ({ exercises, complete, dismissAll, remove, reorder, add }),
    [exercises, complete, dismissAll, remove, reorder, add],
  );

  return <ExercisesContext.Provider value={value}>{children}</ExercisesContext.Provider>;
}

export function useExercises() {
  const value = useContext(ExercisesContext);
  if (!value) throw new Error('useExercises must be used inside an ExercisesProvider');
  return value;
}
