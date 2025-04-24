import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import Providers from "../components/Providers";
import NavBar from '../components/NavBar';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "呓语之牌",
  description: "神秘卡牌游戏",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body className={inter.className + " bg-gray-900 text-white min-h-screen flex flex-col"}>
        <Providers>
          <header className="bg-gray-800 shadow-md">
            <div className="container mx-auto flex justify-between items-center p-4">
              <Link href="/" className="text-2xl font-bold text-purple-300 hover:text-purple-200 transition-colors">
                呓语之牌
              </Link>
              <NavBar />
            </div>
          </header>
          <main className="container mx-auto py-8 px-4 flex-grow">
            {children}
          </main>
          <footer className="bg-gray-800 text-center p-4 text-gray-400 text-sm">
            <div className="container mx-auto">
              &copy; {new Date().getFullYear()} 呓语之牌 - 神秘世界尽在掌握
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
