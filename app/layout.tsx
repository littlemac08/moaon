import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "모아온 — 작은 오늘을 모아, 더 나은 나로",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "모아온", statusBarStyle: "default" },
  icons: { apple: "/icon-180.png" },
  description:
    "꾸준히 모아온 시간과 순간. 유리(유령오리)와 함께 주간 목표를 채우고 나만의 영상을 만들어보세요.",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#314f78",
};
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
