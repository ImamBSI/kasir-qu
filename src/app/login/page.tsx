"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  Store,
  UserRound,
} from "lucide-react";
import authUsersData from "@/data/authUsers.json";
import type { AuthUser, UserRole } from "@/types";

const authUsers = authUsersData as AuthUser[];
const redirectByRole: Record<UserRole, string> = {
  SADM: "/",
  ADM: "/",
  STF: "/pages/pembelian",
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username.trim() || !password) {
      setError("Username dan password wajib diisi.");
      return;
    }

    const account = authUsers.find(
      (user) =>
        user.username === username.trim() && user.password === password,
    );

    if (!account) {
      setError("Username atau password salah.");
      return;
    }

    setError("");
    localStorage.setItem(
      "kasirqu-user",
      JSON.stringify({
        id: account.id,
        name: account.name,
        username: account.username,
        role: account.role,
      }),
    );
    router.push(redirectByRole[account.role]);
  };

  return (
    <div className="flex min-h-dvh bg-slate-50">
      <aside className="hidden w-[42%] flex-col justify-between bg-gradient-to-br from-blue-700 to-blue-950 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-white/15">
            <Store className="size-6" />
          </div>
          <div>
            <p className="text-xl font-bold">KasirQu</p>
            <p className="text-sm text-blue-200">Admin Console</p>
          </div>
        </div>

        <div className="max-w-md">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
            Satu sistem, akses sesuai peran
          </p>
          <h1 className="text-4xl font-bold leading-tight">
            Kelola bisnis lebih mudah dan teratur.
          </h1>
          <p className="mt-5 leading-relaxed text-blue-100">
            Dashboard, transaksi, inventory, dan laporan dalam satu platform
            dengan hak akses untuk setiap pengguna.
          </p>
        </div>

        <p className="text-sm text-blue-200">
          © 2026 KasirQu. All rights reserved.
        </p>
      </aside>

      <main className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-700 text-white">
              <Store className="size-5" />
            </div>
            <div>
              <p className="font-bold text-gray-900">KasirQu</p>
              <p className="text-xs text-gray-500">Admin Console</p>
            </div>
          </div>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Selamat datang kembali
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Masuk menggunakan akun yang terdaftar.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Email atau Username
                </label>
                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Masukkan email atau username"
                    className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Masukkan password"
                    className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-11 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={
                      showPassword
                        ? "Sembunyikan password"
                        : "Tampilkan password"
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-400 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
              >
                <LogIn className="size-4" />
                Masuk
              </button>
            </form>
          </section>

          <p className="mt-5 text-center text-xs text-gray-500">
            Hak akses halaman akan menyesuaikan role akun Anda.
          </p>
        </div>
      </main>
    </div>
  );
}
