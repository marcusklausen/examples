import React from "react";
import { toast } from "@/components/ui/use-toast";
import { tryServerAction } from "@/utils/helpers";
import { updateFavoritesAction } from "./actions";

export const useOptimisticSymbols = ({ symbols }: { symbols: string[] }) => {
  const [isPending, startTransition] = React.useTransition();
  const [optimisticSymbols, addOrRemoveOptimisticSymbol] = React.useOptimistic(
    symbols.map((s) => ({ name: s, isPending: false })),
    (state, newSymbol: string) => {
      const exists = state.find((s) => s.name === newSymbol);
      return exists
        ? state.map((s) =>
            s.name === newSymbol ? { ...s, isPending: true } : s
          )
        : [...state, { name: newSymbol, isPending: true }];
    }
  );

  const MAX_FAVORITES = 5;

  const removeSymbol = (value: string) => {
    startTransition(() => {
      addOrRemoveOptimisticSymbol(value);
      tryServerAction(() =>
        updateFavoritesAction(
          optimisticSymbols.filter((p) => p.name !== value).map((s) => s.name)
        )
      );
      toast({
        title: "Removed from favorites",
        description: value,
      });
    });
  };

  const addSymbol = (value: string) => {
    if (optimisticSymbols.length >= MAX_FAVORITES) return;
    startTransition(() => {
      addOrRemoveOptimisticSymbol(value);
      tryServerAction(() => updateFavoritesAction([...symbols, value]));
      toast({
        title: "Added to favorites",
        description: value,
      });
    });
  };

  return {
    optimisticSymbols,
    isPending,
    addSymbol,
    removeSymbol,
  };
};

// from other file

export async function tryServerAction<T>(
  action: (...args: any[]) => StandardResponse<T>,
  ...args: any[]
): Promise<T | undefined> {

    try {
      const result = await action(...args);
      if (result.error) {
        throw result.error;
      }
      return result.data;
    } catch (error) {
      toast({
        title: "Error",
        description:
          error.frontendMessage ||
          "An unknown error occurred, please check your internet and try again.",
        variant: "destructive",
      });
      return undefined;
    }
}
