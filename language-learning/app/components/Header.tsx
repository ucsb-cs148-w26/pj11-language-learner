"use client";
// TEST-HEADER-123
import Link from "next/link";

export default function Header() {
  return (
    <nav className="flex gap-4 border-b pb-3 mb-4">
      <Link href="/profile">Profile</Link>
      <Link href="/connections">Connections</Link>
      <Link href="/discover">Discover</Link>
      <Link href="/dashboard">Dashboard</Link>
    </nav>
  );
}