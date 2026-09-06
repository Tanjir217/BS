import { Bell, Search } from "lucide-react";

function AdminHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-black/8 bg-[#f7f7f5]/95 backdrop-blur">
      <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Search */}
        <div className="hidden items-center gap-3 rounded-xl border border-black/8 bg-white px-4 py-2.5 md:flex md:w-80">
          <Search size={17} className="text-black/35" />

          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-black/35"
          />
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-black/8 bg-white text-black/55 transition hover:text-black"
          >
            <Bell size={17} strokeWidth={1.8} />

            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-black" />
          </button>

          <div className="flex items-center gap-3 border-l border-black/8 pl-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-xs font-medium text-white">
              A
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-medium">Admin</p>
              <p className="text-xs text-black/40">Store Manager</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;