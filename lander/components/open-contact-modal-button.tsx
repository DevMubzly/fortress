"use client";

import { ReactNode } from "react";
import { useModal } from "./modal-context";
import { cn } from "@/lib/utils";

interface OpenContactModalButtonProps {
  children: ReactNode;
  className?: string;
}

export default function OpenContactModalButton({ children, className }: OpenContactModalButtonProps) {
  const { openModal } = useModal();

  return (
    <button onClick={openModal} className={className}>
      {children}
    </button>
  );
}
