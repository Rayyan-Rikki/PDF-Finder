"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UnpublishWorksheetButtonProps {
  worksheetId: string;
  title: string;
  className?: string;
  redirectTo?: string;
  onUnpublished?: () => void | Promise<void>;
}

export default function UnpublishWorksheetButton({
  worksheetId,
  title,
  className,
  redirectTo,
  onUnpublished,
}: UnpublishWorksheetButtonProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleUnpublish = async () => {
    const confirmed = window.confirm(`Take "${title}" offline? Students will no longer be able to access it.`);
    if (!confirmed) {
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/worksheets/${worksheetId}/unpublish`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Unpublish failed.");
      }

      if (onUnpublished) {
        await onUnpublished();
      }

      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } catch (error: unknown) {
      window.alert(error instanceof Error ? error.message : "Unpublish failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={handleUnpublish}
      disabled={submitting}
    >
      <EyeOff className="mr-2 h-4 w-4" />
      {submitting ? "Unpublishing..." : "Unpublish"}
    </Button>
  );
}
