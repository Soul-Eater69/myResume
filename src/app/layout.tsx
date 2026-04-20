import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Open Resume Platform",
  description: "Career knowledge platform with tailored resume generation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
