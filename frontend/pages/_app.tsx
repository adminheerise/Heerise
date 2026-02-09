import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getAccess } from "@/lib/auth";
import { apiGet } from "@/lib/api";

export default function App({ Component, pageProps }: AppProps) {
  const [authed, setAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = getAccess();
    setAuthed(!!token);
    if (!token) return;
    (async () => {
      try {
        const me = await apiGet("/me", true);
        setIsAdmin(me?.role === "admin");
      } catch {
        // token invalid or backend down -> keep nav minimal
        setIsAdmin(false);
      }
    })();
  }, []);
  return (
    <div className="container">
      <nav className="nav">
        <Link href="/">Home</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/profile">Profile</Link>
        {authed && <Link href="/settings">Settings</Link>}
        {authed && isAdmin && <Link href="/admin">Admin</Link>}
        {!authed && <Link href="/login">Login</Link>}
        {!authed && <Link href="/register">Register</Link>}
      </nav>
      <Component {...pageProps} />
    </div>
  );
}
