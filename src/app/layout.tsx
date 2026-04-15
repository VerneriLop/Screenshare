import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Screenshare",
  description: "Simple screen sharing MVP built with Next.js and WebRTC.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#07110f] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
