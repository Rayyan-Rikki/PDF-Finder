"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteWorksheetButtonProps {
  worksheetId: string;
  title: string;
  className?: string;
  iconOnly?: boolean;
  redirectTo?: string;
  onDeleted?: () => void | Promise<void>;
}

export default function DeleteWorksheetButton({
  worksheetId,
  title,
  className,
  iconOnly = false,
  redirectTo,
  onDeleted,
}: DeleteWorksheetButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete "${title}"? This removes the PDF, draft data, and published questions.`);
    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      const res = await fetch(`/api/worksheets/${worksheetId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Delete failed.");
      }

      if (onDeleted) {
        await onDeleted();
      }

      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } catch (error: unknown) {
      window.alert(error instanceof Error ? error.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size={iconOnly ? "icon" : "sm"}
      className={className}
      onClick={handleDelete}
      disabled={deleting}
    >
      <Trash2 className={iconOnly ? "h-5 w-5" : "mr-2 h-4 w-4"} />
      {iconOnly ? null : deleting ? "Deleting..." : "Delete Worksheet"}
    </Button>
  );
}
