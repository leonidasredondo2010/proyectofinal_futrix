import { useEffect } from "react";

export function useCloseOnOutside(ref, isOpen, onClose) {
  useEffect(() => {
    if (!isOpen) return undefined;

    function handlePointerDown(event) {
      if (!ref.current?.contains(event.target)) onClose();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, onClose, ref]);
}
