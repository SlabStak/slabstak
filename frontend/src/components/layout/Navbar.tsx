"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface User {
  id: string;
  email?: string;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/me");
        const data = await res.json();
        setUser(data.user);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  return (
    <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-[10px] font-semibold tracking-[0.18em] text-sky-400">
            SS
          </div>
          <span className="font-semibold text-sm tracking-[0.16em] uppercase text-slate-100">
            SlabStak
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-xs md:text-sm">
          <Link href="/scan" className="text-slate-300 hover:text-sky-400">Scan</Link>
          <Link href="/vault" className="text-slate-300 hover:text-sky-400">Vault</Link>
          <Link href="/pricing" className="text-slate-300 hover:text-sky-400">Pricing</Link>
          {user ? (
            <Link
              href="/account"
              className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-950 font-semibold text-xs hover:bg-sky-400"
            >
              Account
            </Link>
          ) : (
            <Link
              href="/auth"
              className="px-3 py-1.5 rounded-full border border-slate-700 text-slate-100 font-semibold text-xs hover:border-sky-400"
            >
              Sign in to save
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
