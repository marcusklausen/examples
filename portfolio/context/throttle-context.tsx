"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useState } from "react";

const throttleMap = {
  0: "No throttle",
  200: "200ms",
  500: "500ms",
  1000: "1s",
  3000: "3s",
  10000: "10s",
} as const;

type TThrottleKey = keyof typeof throttleMap;

type ThrottleContextType = {
  throttle: TThrottleKey;
  setThrottle: (value: TThrottleKey) => void;
};

const ThrottleContext = createContext<ThrottleContextType | undefined>(
  undefined
);

export function ThrottleProvider({ children }: { children: React.ReactNode }) {
  const [throttle, setThrottle] = useState<TThrottleKey>(0);
  return (
    <ThrottleContext.Provider value={{ throttle, setThrottle }}>
      {children}
    </ThrottleContext.Provider>
  );
}

export function useThrottleRouter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const context = useContext(ThrottleContext);

  const setParam = useCallback(
    (key: string, value: string | string[] | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (context?.throttle) {
        params.set("throttle", context.throttle.toString());
      } else {
        params.delete("throttle");
      }

      if (!value) {
        params.delete(key);
      }

      if (typeof value === "string") {
        params.set(key, value);
      }

      if (Array.isArray(value)) {
        if (value.length > 0) {
          params.set(key, value.join(","));
        } else {
          params.delete(key);
        }
      }

      router.push(`/?${params.toString()}`);
    },
    [router, searchParams, context?.throttle]
  );

  const getParam = useCallback(
    (key: string): string[] => {
      return searchParams.get(key)?.split(",") || [];
    },
    [searchParams]
  );

  if (!context) {
    throw new Error("useThrottle must be used within ThrottleProvider");
  }

  return {
    setParam,
    getParam,
    push: router.push,
    searchParams,
    throttleMap,
    ...context,
  };
}
