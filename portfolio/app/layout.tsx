import localFont from "next/font/local";
import "./globals.css";
import { Metadata } from "next";
import { ThrottleProvider } from "../context/throttle-context";
import Navigation from "./_components/navigtation";

import { Suspense } from "react";
import ThrottleDropdown from "./_components/throttle-dropdown";
import Title from "./_components/title";
import ProfileHeader from "./_components/profile-header";
import Search from "./_components/search";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Marcus Klausen | Software Engineer",
  description: "Software Engineer from Denmark",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased group/page ${geistSans.variable} ${geistMono.variable}`}
      >
        <ThrottleProvider>
          <ProfileHeader className=" flex flex-col items-center pt-20 pb-4" />
          <Suspense>
            <Navigation className="mx-auto w-fit mt-8" />
          </Suspense>
          <main className="mx-auto w-full max-w-[920px] px-6">
            <div className="w-full max-w-[920px] mx-auto px-6 py-16 space-y-20">
              <div className="group/resources">
                <div className="flex items-center justify-between mb-8">
                  <Title />
                  <Suspense>
                    <ThrottleDropdown />
                  </Suspense>
                </div>
                <Suspense>
                  <Search />
                </Suspense>
                <div className="my-8">{children}</div>
              </div>
            </div>
          </main>
        </ThrottleProvider>
      </body>
    </html>
  );
}
