import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gram",
  description: "친구들과 함께 기록하는 몸무게",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-page shadow-[0_0_40px_rgba(25,31,40,0.08)]">
          {children}
        </div>
      </body>
    </html>
  );
}
