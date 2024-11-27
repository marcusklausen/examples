import React from "react";
import { WorkItem } from "./_components/work-item";

export default async function Page() {
  return (
    <div className="grid gap-6 mt-6">
      <WorkItem
        title="TradingSprout.com"
        description="My personal SaaS venture. Built with React, TypeScript, Tailwind, Next.js and Server Components."
        href="https://tradingsprout.com"
        tags={[
          "React",
          "TypeScript",
          "Tailwind",
          "Next.js",
          "Server Components",
        ]}
      />
      <WorkItem
        href="https://katjakurz.dk"
        github="https://github.com/marcusklausen/katjakurz.dk"
        title="Katjakurz.dk"
        description="Portfolio website for showcasing professional work. Designed by Katja, built by me."
        tags={["Portfolio", "Design", "UX/UI"]}
      />
      <WorkItem
        href="https://ginoaward.com"
        title="GinoAward.com"
        description="Shop for the Gino Award. Built with React, TypeScript, Tailwind, Next.js and Stripe."
        tags={["Music", "Streaming", "SSG", "Static", "Stripe"]}
      />
    </div>
  );
}
