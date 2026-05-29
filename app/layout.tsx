import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "로아 숙제 - 로스트아크 숙제 관리",
  description: "로스트아크 전투정보실 조회와 일일/주간 숙제 관리",
};

const navItems = [
  { href: "/", label: "캐릭터 조회" },
  { href: "/homework", label: "숙제 체크" },
  { href: "/calculator", label: "계산기" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        <header className="border-b border-white/10 bg-[#141722] sticky top-0 z-10">
          <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
            <Link href="/" className="text-lg font-bold text-amber-400">
              로아 숙제
            </Link>
            <nav className="flex gap-4 text-sm">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-300 transition hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-8 text-center text-xs text-gray-500">
          데이터 출처: 로스트아크 공식 오픈 API · 비공식 팬 사이트
        </footer>
      </body>
    </html>
  );
}
