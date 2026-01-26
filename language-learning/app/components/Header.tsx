"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const links = [
    { href: "/profile", label: "Profile" },
    { href: "/connections", label: "Connections" },
    { href: "/discover", label: "Discover" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  return (
    <nav className="w-full border-b bg-white shadow-sm">
      <div className="mx-auto max-w-5xl px-8 py-5 flex gap-10 text-lg justify-center">
        {links.map(({ href, label }) => {
          const active = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={`relative group transition ${
                active
                  ? "font-semibold text-blue-600"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              {label}

              {/* Active underline */}
              {active && (
                <span className="absolute left-1/2 -bottom-1 h-[2px] w-[60%] -translate-x-1/2 bg-blue-600 rounded-full"></span>
              )}

              {/* Hover underline */}
              {!active && (
                <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
