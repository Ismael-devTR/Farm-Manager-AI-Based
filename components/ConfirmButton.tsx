"use client";

import { useState, useTransition } from "react";
import ConfirmModal from "@/components/ConfirmModal";
import { useDict } from "@/components/LocaleProvider";

type Props = {
  action: () => Promise<void>;
  message: string;
  label: string;
  pendingLabel?: string;
  className?: string;
};

export default function ConfirmButton({
  action,
  message,
  label,
  pendingLabel = "...",
  className,
}: Props) {
  const dict = useDict();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    setOpen(false);
    startTransition(() => action());
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        className={className}
      >
        {pending ? pendingLabel : label}
      </button>

      <ConfirmModal
        open={open}
        message={message}
        confirmLabel={label}
        cancelLabel={dict.common.cancel}
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
