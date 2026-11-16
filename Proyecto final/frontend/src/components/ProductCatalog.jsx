import { formatPrice } from "../../../shared/catalog.js";

export default function ProductCatalog({ size, products, onSelectImage, onAdd, onBackToSizes }) {
  return (
    <section className="catalogo" id="catalogo">
      <a
        className="volver-inicio-flecha"
        href="/#tallas"
        aria-label="Volver a la sección de tallas"
        title="Volver a las tallas"
        onClick={(event) => {
          event.preventDefault();
          onBackToSizes();
        }}
      >
        <span aria-hidden="true">←</span>
      </a>
      <a className="volver-inicio-texto" href="/#inicio">Volver al inicio</a>
      <p className="etiqueta">Colección para porteros</p>
      <h2>Guantes Golty - Talla {size}</h2>
      <div className="productos">
        {products.map((product) => (
          <article className="producto" key={product.id}>
            <button
              className="producto-imagen-boton"
              type="button"
              onClick={() => onSelectImage(product)}
              aria-label={`Ampliar foto de ${product.name}, talla ${product.size}`}
            >
              <img
                className="producto-imagen"
                src={product.image}
                alt={`Guantes ${product.name}, talla ${product.size}`}
                loading="lazy"
              />
            </button>
            <div className="producto-detalle">
              <p className="marca-producto">Golty</p>
              <h3>Guantes de portero</h3>
              <p>Referencia {product.reference}</p>
              <p>Talla {product.size}</p>
              <p>Unidades disponibles: {product.stock}</p>
              <p className="producto-precio">{formatPrice(product.price)} COP</p>
              <button className="boton" type="button" onClick={() => onAdd(product.id)}>
                Agregar al carrito
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
