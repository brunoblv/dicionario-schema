import "../styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prisma Data Dictionary",
  description: "A Next.js application for generating a Prisma Data Dictionary.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
