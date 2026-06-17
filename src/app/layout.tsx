import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { BUSINESS_NAME } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: BUSINESS_NAME,
  description: "Book your next appointment in seconds.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans bg-ivory text-espresso antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
