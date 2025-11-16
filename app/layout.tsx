import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StoryTree - Transform Your Family History into Stories",
  description: "Turn your genealogy data into interactive, documentary-style family stories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
