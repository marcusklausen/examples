"use client";

import { ChevronDown, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { tryServerAction } from "@/utils/helpers";
import { syncPositionsAction } from "./actions.server";

export function SyncTradesButton({
  favoriteSymbols,
}: {
  favoriteSymbols: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSync = async (symbol: string) => {
    startTransition(() => {
      tryServerAction(() => syncPositionsAction(symbol)).then(() => {
        toast({
          title: "Synced",
          variant: "default",
          description: `Your ${symbol} trades have been synced`,
        });
      });
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sync Trades <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {favoriteSymbols.map((symbol) => (
          <DropdownMenuItem key={symbol} onClick={() => handleSync(symbol)}>
            {symbol}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
