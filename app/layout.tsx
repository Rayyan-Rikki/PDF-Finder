import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PDF Finder - Worksheet to Quiz",
  description: "Convert uploaded worksheet PDFs into reusable interactive quizzes using AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
