"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import EditModal from "@/components/EditModal";
import { useDict } from "@/components/LocaleProvider";

const EditModalContext = createContext<(() => void) | null>(null);

export function useEditModalClose() {
  return useContext(EditModalContext);
}

type Props = {
  title: string;
  children: ReactNode;
  className?: string;
};

export default function EditButton({ title, children, className }: Props) {
  const dict = useDict();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? "text-xs text-blue-600 hover:underline"}
      >
        {dict.common.edit}
      </button>

      <EditModal open={open} onClose={close} title={title}>
        <EditModalContext.Provider value={close}>
          {children}
        </EditModalContext.Provider>
      </EditModal>
    </>
  );
}
