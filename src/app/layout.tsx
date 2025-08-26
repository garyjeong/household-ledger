import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { GroupProvider } from "@/contexts/group-context";
import { AlertProvider } from "@/contexts/alert-context";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "우리집 가계부",
  description: "개인 및 그룹 가계부 관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${jetbrainsMono.variable} antialiased font-sans`}
      >
        <AlertProvider>
          <AuthProvider>
            <GroupProvider>
              {children}
            </GroupProvider>
          </AuthProvider>
        </AlertProvider>
      </body>
    </html>
  );
}