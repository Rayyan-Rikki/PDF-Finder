"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogoutButtonProps {
  className?: string;
  redirectTo?: string;
  variant?: "default" | "outline" | "ghost";
}

export default function LogoutButton({
  className,
  redirectTo = "/auth",
  variant = "outline",
}: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      router.push(redirectTo);
      router.refresh();
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant={variant} className={className} onClick={handleLogout} disabled={loading}>
      <LogOut className="mr-2 h-4 w-4" />
      {loading ? "Signing out..." : "Sign Out"}
    </Button>
  );
}
