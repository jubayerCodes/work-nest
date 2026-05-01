"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useWorkspaceStore } from "@/store/workspace.store";
import { useSocket } from "@/hooks/useSocket";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { api } from "@/lib/api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setUser } = useAuthStore();
  const { fetchWorkspaces, activeWorkspace } = useWorkspaceStore();
  const [ready, setReady] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      try {
        // Always validate session against the API
        const res = await api.get("/auth/me");
        setUser(res.data.data.user);
      } catch (err: unknown) {
        // Only redirect on explicit 401 — ignore network/other errors
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 401) {
          router.replace("/login");
          return;
        }
      }

      // Hydrate workspaces in background
      await fetchWorkspaces().catch(() => {});
      setReady(true);
    };

    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Mount socket for active workspace room
  useSocket(activeWorkspace?.id);

  return (
    <div className="page-wrapper">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>{children}</main>
      </div>
    </div>
  );
}
