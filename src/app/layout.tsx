import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Weekend Quests",
  description: "Discover things to do in London this weekend.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700,900&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
