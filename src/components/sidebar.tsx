

import { PanelLeft, Home, Settings, ShoppingBasketIcon, WarehouseIcon } from "lucide-react";

export default function SideBar() {
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
          <div className="px-4">Navbar Title</div>
        </nav>
        {/* Page content here */}
        <div className="p-4">Page Content</div>
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
              <button
                className="is-drawer-close:tooltip is-drawer-close:tooltip-right"
                data-tip="Homepage"
              >
                <Home className="size-4" />
                <span className="is-drawer-close:hidden">Homepage</span>
              </button>
            </li>
            <li>
              <button
                className="is-drawer-close:tooltip is-drawer-close:tooltip-right"
                data-tip="Pembelian"
              >
                <ShoppingBasketIcon className="size-4" />
                <span className="is-drawer-close:hidden">Pembelian</span>
              </button>
            </li>
            <li>
              <button
                className="is-drawer-close:tooltip is-drawer-close:tooltip-right"
                data-tip="Input Barang"
              >
                <WarehouseIcon className="size-4" />
                <span className="is-drawer-close:hidden">Input Barang</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
