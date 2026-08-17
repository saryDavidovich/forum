"use client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      style={{ background: "transparent", color: "#f3e6c8", borderColor: "#f3e6c8" }}
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
    >
      התנתקות
    </button>
  );
}
