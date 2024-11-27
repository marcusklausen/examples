import React, { useOptimistic, useTransition } from "react";
import { voteAction } from "./votes.action";
import { Loader2 } from "lucide-react";

type TVoteDirection = "up" | "down";

export default function Votes({
  votes,
  resourceId,
}: {
  votes: number;
  resourceId: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticVotes, setOptimisticVotes] = useOptimistic(
    votes,
    (state, action: TVoteDirection) => {
      return action === "up" ? state + 1 : state - 1;
    }
  );

  const handleVote = (direction: TVoteDirection) => {
    startTransition(async () => {
      setOptimisticVotes(direction);
      await voteAction(direction, resourceId);
    });
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={() => handleVote("up")}
        className="text-gray-400 hover:text-[#0070f3] transition-colors"
      >
        ▲
      </button>
      <span className="text-sm font-medium h-5 flex items-center">
        {isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          optimisticVotes
        )}
      </span>
      <button
        onClick={() => handleVote("down")}
        className="text-gray-400 hover:text-[#0070f3] transition-colors"
      >
        ▼
      </button>
    </div>
  );
}
