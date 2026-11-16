import { useRef, useState } from "react";
import { formatPrice } from "../../../shared/catalog.js";
import { useCloseOnOutside } from "../hooks/useCloseOnOutside";

export default function ShoppingCart({ items, onChangeQuantity, onClear, onOrder, status, whatsappLink, isOpen, onToggle, onClose, isAuthenticated, onRequireLogin }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cartRef = useRef(null);
  useCloseOnOutside(cartRef, isOpen, onClose);

  const units = items.reduce((total, item) => total + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  async function submitOrder(event) {
    event.preventDefault();
    if (!items.length || isSubmitting) return;

    const data = new FormData(event.currentTarget);
    setIsSubmitting(true);
    try {
      await onOrder({
        name: data.get("nombre"),
        phone: data.get("telefono"),
        email: data.get("correo"),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="carrito-flotante" ref={cartRef}>
      {isOpen && (
        <section className="carrito-panel" aria-label="Tu pedido">
          <div className="carrito-panel-cabecera">
            <h2>Tu pedido</h2>
            <button className="boton-vaciar" type="button" onClick={onClear} disabled={!items.length}>
              Vaciar carrito
            </button>
          </div>
          <div className="lista-carrito" aria-live="polite">
            {items.length ? items.map(({ product, quantity }) => (
              <article className="carrito-item" key={product.id}>
                <div className="carrito-producto">
                  <strong>{product.name} · Talla {product.size}</strong>
                  <span>{formatPrice(product.price)} COP por unidad</span>
                </div>
                <div className="controles-cantidad" aria-label={`Cantidad de ${product.name}, talla ${product.size}`}>
                  <button type="button" onClick={() => onChangeQuantity(product.id, -1)} aria-label={`Disminuir ${product.name}`}>−</button>
                  <span>{quantity}</span>
                  <button type="button" onClick={() => onChangeQuantity(product.id, 1)} aria-label={`Aumentar ${product.name}`}>+</button>
                </div>
                <button className="boton-quitar" type="button" onClick={() => onChangeQuantity(product.id, 0)}>
                  Quitar
                </button>
              </article>
            )) : <p className="carrito-vacio">Aún no agregas productos.</p>}
          </div>
          <p className="carrito-total">
            Total: <strong>{formatPrice(total)} COP</strong>
          </p>
          {!isAuthenticated && items.length ? (
            <div className="checkout-login">
              <p>Para completar tu compra, inicia sesión en tu cuenta Futrix.</p>
              <button className="boton" type="button" onClick={onRequireLogin}>
                Iniciar sesión para comprar
              </button>
            </div>
          ) : (
            <form className="checkout-form" onSubmit={submitOrder}>
              <h3>Datos para tu pedido</h3>
              <label>
                Nombre completo
                <input name="nombre" autoComplete="name" minLength="2" maxLength="100" required disabled={!items.length || isSubmitting} />
              </label>
              <label>
                WhatsApp de contacto
                <input name="telefono" type="tel" autoComplete="tel" minLength="7" maxLength="20" required disabled={!items.length || isSubmitting} />
              </label>
              <label>
                Correo electrónico <span>(opcional)</span>
                <input name="correo" type="email" autoComplete="email" maxLength="254" disabled={!items.length || isSubmitting} />
              </label>
              <button className="boton" type="submit" disabled={!items.length || isSubmitting}>
                {isSubmitting ? "Enviando..." : "Continuar por WhatsApp"}
              </button>
            </form>
          )}
          {status && <p className="estado-carrito" role="status">{status}</p>}
          {whatsappLink && (
            <a className="boton enlace-whatsapp" href={whatsappLink} target="_blank" rel="noopener noreferrer">
              Abrir WhatsApp para enviar pedido
            </a>
          )}
        </section>
      )}
      <button
        className="carrito-boton"
        type="button"
        aria-label={isOpen ? "Cerrar carrito" : "Abrir carrito"}
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span className="icono-carrito" aria-hidden="true">🛒</span>
        <span className="contador-carrito">{units}</span>
      </button>
    </div>
  );
}
