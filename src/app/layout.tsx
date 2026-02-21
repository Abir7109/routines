import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Student's Routine - Premium Productivity",
  description: "A futuristic productivity system designed for focused learning and efficient schedule management.",
  keywords: ["productivity", "focus", "study", "routine", "schedule", "learning"],
  authors: [{ name: "Student's Routine" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Student's Routine",
    description: "A futuristic productivity system for focused learning",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Student's Routine",
    description: "A futuristic productivity system for focused learning",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-background text-foreground font-sans min-h-screen flex flex-col`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
