import type { Metadata } from "next";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackClientApp } from "../stack/client";
import { Chakra_Petch } from "next/font/google";
import "./globals.css";

const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Agent Arena",
  description: "Live audience-powered AI agent competition",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Russo+One&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${chakraPetch.variable} antialiased`}>
        <StackProvider app={stackClientApp}>
          <StackTheme>
            {children}
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  );
}
