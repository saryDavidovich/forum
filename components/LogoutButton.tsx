"use client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      style={{ background: "transparent" }}
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
