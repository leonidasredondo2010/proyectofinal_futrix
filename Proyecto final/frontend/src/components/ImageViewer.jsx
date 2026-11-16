import { useEffect } from "react";
import { sitePath } from "../utils/sitePath";

export default function ImageViewer({ product, onClose }) {
  useEffect(() => {
    if (!product) return undefined;

    function closeOnEscape(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [product, onClose]);

  if (!product) return null;

  return (
    <div
      className="visor-imagen"
      role="dialog"
      aria-modal="true"
      aria-label={`${product.name}, talla ${product.size}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="visor-imagen-contenido">
        <button
          className="visor-imagen-cerrar"
          type="button"
          onClick={onClose}
          aria-label="Cerrar imagen ampliada"
        >
          Cerrar
        </button>
        <img
          src={sitePath(product.image)}
          alt={`Guantes ${product.name}, talla ${product.size}`}
        />
        <p>{product.name} · Talla {product.size}</p>
      </div>
    </div>
  );
}
