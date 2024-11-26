import React from "react";

import { ProtectedPhone } from "./protected-phone";
import Link from "next/link";
import Image from "next/image";
import { NavLink } from "./nav-link";

export default function ProfileHeader({ className }: { className?: string }) {
  return (
    <header className={className}>
      <Link
        href="https://www.linkedin.com/in/marcusklausen/"
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
      >
        <Image
          className="grayscale contrast-125 rounded-lg"
          src="/marcus.jpeg"
          alt="Marcus"
          placeholder="empty"
          width={100}
          height={100}
          priority
        />
      </Link>

      <nav className="mt-10 flex gap-4 px-4 flex-wrap items-center justify-center">
        <NavLink href="tel:+4561337136">
          <ProtectedPhone fullNumber="+45 61 33 71 36" />
        </NavLink>
        <NavLink href="mailto:hello@makl.dk" external>
          hello@makl.dk
        </NavLink>
        <NavLink href="https://www.linkedin.com/in/marcusklausen/" external>
          LinkedIn
        </NavLink>
      </nav>

      <div className="text-center max-w-[600px] mx-auto px-4 mt-8 text-sm text-gray-600">
        <p>
          TypeScript wizard and founder of{" "}
          <Link
            href="https://tradingsprout.com"
            target="_blank"
            className="font-medium text-gray-800 underline underline-offset-1"
          >
            tradingsprout.com
          </Link>
          , crafting delightful React experiences.
          <br /> Fun fact: This site was 95% generated by Claude 3.5.
        </p>
      </div>
    </header>
  );
}
