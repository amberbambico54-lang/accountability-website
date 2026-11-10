"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

type JsonParser<T> = (value: unknown) => T;

function identityParser<T>(value: unknown): T {
  return value as T;
}

function reportStorageError(message: string) {
  window.dispatchEvent(new CustomEvent("our-space:storage-error", { detail: message }));
}

export function useLocalStorageJson<T>(
  key: string,
  initialValue: T,
  parse: JsonParser<T> = identityParser,
): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [value, setValue] = useState(initialValue);
  const [loaded, setLoaded] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const initialValueRef = useRef(initialValue);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      let nextValue = initialValueRef.current;
      let writable = true;

      try {
        const saved = window.localStorage.getItem(key);
        if (saved !== null) nextValue = parse(JSON.parse(saved) as unknown);
      } catch {
        writable = false;
        reportStorageError("Saved data could not be read. Changes will not be saved until you edit this page.");
      }

      if (active) {
        setValue(nextValue);
        setCanWrite(writable);
        setLoaded(true);
      }
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [key, parse]);

  useEffect(() => {
    if (!loaded || !canWrite) return;

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      reportStorageError("Changes could not be saved. Check available browser storage.");
    }
  }, [canWrite, key, loaded, value]);

  const updateValue = useCallback<Dispatch<SetStateAction<T>>>((nextValue) => {
    setCanWrite(true);
    setValue(nextValue);
  }, []);

  return [value, updateValue, loaded];
}
