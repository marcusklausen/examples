"use client";

import { useState } from "react";

export function ProtectedPhone({ fullNumber }: { fullNumber: string }) {
  const [revealed, setRevealed] = useState(false);
  const hiddenNumber = fullNumber.slice(0, -2) + "**";

  return (
    <button
      onClick={() => setRevealed(true)}
      className="text-gray-600 hover:text-gray-800 transition-colors"
    >
      {revealed ? fullNumber : hiddenNumber}
    </button>
  );
}
