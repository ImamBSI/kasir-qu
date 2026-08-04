"use client";

import { PanelLeft, Home, Settings, ShoppingBasketIcon, WarehouseIcon, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "../context/ThemeContext";

const routeTitles: Record<string, string> = {
  "/": "Dashboard",
  "/pages/pembelian": "Pembelian",
  "/pages/gudang": "Input Barang",
};

export default function SideBar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const title = routeTitles[pathname] || "Dashboard";

  return (
    <div className="drawer lg:drawer-open">
      <input id="my-drawer-4" type="checkbox" className="drawer-toggle inline" />
      <div className="drawer-content">
        {/* Navbar */}
        <nav className="navbar w-full bg-base-300">
          <label
            htmlFor="my-drawer-4"
            aria-label="open sidebar"
            className="btn btn-square btn-ghost drawer-button"
          >
            <PanelLeft className="size-4" />
          </label>
          <div className="px-4 font-semibold">{title}</div>
          <div className="ml-auto">
            <button
              onClick={toggleTheme}
              className="btn btn-ghost btn-circle"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="size-5" />
              ) : (
                <Moon className="size-5" />
              )}
            </button>
          </div>
        </nav>
        {/* Page content */}
        {children}
      </div>

      <div className="drawer-side is-drawer-close:overflow-visible">
        <label
          htmlFor="my-drawer-4"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>
        <div className="flex min-h-full flex-col items-start bg-base-200 is-drawer-close:w-14 is-drawer-open:w-64">
          <ul className="menu w-full grow">
            <li>
              <Link
                href="/"
                className={pathname === "/" ? "active" : ""}
              >
                <Home className="size-4" />
                <span className="is-drawer-close:hidden">Homepage</span>
              </Link>
            </li>
            <li>
              <Link
                href="/pages/pembelian"
                className={pathname === "/pages/pembelian" ? "active" : ""}
              >
                <ShoppingBasketIcon className="size-4" />
                <span className="is-drawer-close:hidden">Pembelian</span>
              </Link>
            </li>
            <li>
              <Link
                href="/pages/gudang"
                className={pathname === "/pages/gudang" ? "active" : ""}
              >
                <WarehouseIcon className="size-4" />
                <span className="is-drawer-close:hidden">Input Barang</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
