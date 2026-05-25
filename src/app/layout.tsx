import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { UserProvider } from "@/lib/UserContext";

export const metadata: Metadata = {
  title: "Adaptive Denoising - AI-Powered Audio Cleaning",
  description: "State-of-the-art audio signal cleaning using advanced adaptive filters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-full antialiased font-sans" suppressHydrationWarning>
        <ThemeProvider>
          <UserProvider>
            {children}
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
