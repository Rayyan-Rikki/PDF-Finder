"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RetryProcessingButton({ worksheetId }: { worksheetId: string }) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");

  const handleRetry = async () => {
    setRetrying(true);
    setError("");

    try {
      const res = await fetch(`/api/worksheets/${worksheetId}/retry`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Retry failed.");
      }

      router.refresh();
    } catch (retryError: unknown) {
      setError(retryError instanceof Error ? retryError.message : "Retry failed.");
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleRetry} disabled={retrying}>
        <RefreshCw className={`mr-2 h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
        {retrying ? "Retrying..." : "Retry Processing"}
      </Button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
