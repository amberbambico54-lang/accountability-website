"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type ConfirmDeleteButtonProps = {
  itemName: string;
  ariaLabel: string;
  onConfirm: () => void;
  description?: string;
  confirmLabel?: string;
};

export function ConfirmDeleteButton({
  itemName,
  ariaLabel,
  onConfirm,
  description = `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
  confirmLabel = "Delete",
}: ConfirmDeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <Button type="button" size="icon" variant="ghost" aria-label={ariaLabel} onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClose={() => setOpen(false)}
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-[28px] border border-[#E7E0D2] bg-[#FAF7F2] p-0 text-[#313B32] shadow-2xl backdrop:bg-[#202820]/50"
      >
        <div className="space-y-4 p-6">
          <div>
            <h2 id={titleId} className="text-xl font-semibold">Confirm {confirmLabel.toLowerCase()}</h2>
            <p id={descriptionId} className="mt-2 text-sm text-[#4E5A52]">{description}</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="button" className="bg-[#8B3F3F] text-white hover:bg-[#733333]" onClick={() => {
              onConfirm();
              setOpen(false);
            }}>{confirmLabel}</Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
