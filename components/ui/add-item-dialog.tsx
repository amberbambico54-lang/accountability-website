"use client";

import { useEffect, useId, useRef } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type AddItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  triggerLabel: string;
  children: React.ReactNode;
};

export function AddItemDialog({
  open,
  onOpenChange,
  title,
  description,
  triggerLabel,
  children,
}: AddItemDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dialogTitleId = useId();
  const dialogDescriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <Button type="button" onClick={() => onOpenChange(true)}>
        <Plus className="h-4 w-4" />
        {triggerLabel}
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby={dialogTitleId}
        aria-describedby={description ? dialogDescriptionId : undefined}
        onClose={() => onOpenChange(false)}
        onCancel={(event) => {
          event.preventDefault();
          onOpenChange(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onOpenChange(false);
          }
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) onOpenChange(false);
        }}
        className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-[28px] border border-[#E7E0D2] bg-[#FAF7F2] p-0 text-[#313B32] shadow-2xl backdrop:bg-[#202820]/50"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E7E0D2] px-6 py-5">
          <div>
            <h2 id={dialogTitleId} className="text-xl font-semibold">{title}</h2>
            {description && <p id={dialogDescriptionId} className="mt-1 text-sm text-[#4E5A52]">{description}</p>}
          </div>
          <Button type="button" size="icon" variant="ghost" aria-label="Close dialog" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-4 p-6">{children}</div>
      </dialog>
    </>
  );
}
