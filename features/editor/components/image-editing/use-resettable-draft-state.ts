"use client";

import { useCallback, useEffect, useState } from "react";

export function cloneDraftValue<T>(value: T): T {
  return structuredClone(value);
}

export function useResettableDraftState<T>(initialValue: T, resetKey: unknown) {
  const [draft, setDraft] = useState<T>(() => cloneDraftValue(initialValue));

  const resetDraft = useCallback(() => {
    setDraft(cloneDraftValue(initialValue));
  }, [initialValue]);

  useEffect(() => {
    setDraft(cloneDraftValue(initialValue));
  }, [initialValue, resetKey]);

  return {
    draft,
    setDraft,
    resetDraft,
  };
}
