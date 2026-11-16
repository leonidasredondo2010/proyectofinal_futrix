import { useEffect, useState } from "react";
import AdminPanel from "./components/admin/AdminPanel";
import ChatWidget from "./components/chatbot/ChatWidget";
import ImageViewer from "./components/ImageViewer";
import ProductCatalog from "./components/ProductCatalog";
import ShoppingCart from "./components/ShoppingCart";
import UserAccount from "./components/UserAccount";
import { sitePath } from "./utils/sitePath";
import { availableSizes, formatPrice, pricesBySize, products } from "../../shared/catalog.js";
import { saveContact, saveOrder } from "./services/api";
import "./App.css";

const whatsappNumber = "573002221220";
const queryParams = new URLSearchParams(window.location.search);
const requestedSize = queryParams.get("talla");
const showAdminPanel = queryParams.get("admin") === "1";
const initialSelectedSize = availableSizes.includes(requestedSize) ? requestedSize : null;

function IconoBalon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="13" />
      <path d="m16 8 5 3.6-1.9 5.8h-6.2L11 11.6 16 8Z" />
      <path d="m16 8 .1-5M21 11.6l5.2-2M19.1 17.4l3.2 4.4M12.9 17.4l-3.2 4.4M11 11.6l-5.2-2M9.7 21.8l1.1 6M22.3 21.8l-1.1 6" />
    </svg>
  );
}

function readSavedCart() {
  try {
    const savedCart = JSON.parse(localStorage.getItem("futrix-carrito") || "{}");
    return Object.fromEntries(
      Object.entries(savedCart).flatMap(([id, quantity]) => {
        const product = products.find((item) => item.id === id);
        const parsedQuantity = Number(quantity);
        return product && Number.isInteger(parsedQuantity) && parsedQuantity > 0
          ? [[id, Math.min(parsedQuantity, product.stock)]]
          : [];
      }),
    );
  } catch {
    return {};
  }
}

function App() {
  const [cart, setCart] = useState(readSavedCart);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedSize, setSelectedSize] = useState(initialSelectedSize);
  const [sectionToScroll, setSectionToScroll] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [cartStatus, setCartStatus] = useState("");
  const [contactStatus, setContactStatus] = useState("");
  const [isContactSubmitting, setIsContactSubmitting] = useState(false);
  const [cartWhatsAppLink, setCartWhatsAppLink] = useState("");
  const [contactWhatsAppLink, setContactWhatsAppLink] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const visibleProducts = selectedSize
    ? products.filter((product) => product.size === selectedSize)
    : [];

  useEffect(() => {
    if (!sectionToScroll || selectedSize) return;
    document.getElementById(sectionToScroll)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedSize, sectionToScroll]);

  useEffect(() => {
    function handlePopState() {
      const params = new URLSearchParams(window.location.search);
      const size = params.get("talla");
      setSelectedSize(availableSizes.includes(size) ? size : null);
      setSectionToScroll(window.location.hash === "#tallas" ? "tallas" : null);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function returnToSizes() {
    window.history.pushState(null, "", sitePath("#tallas"));
    setSelectedSize(null);
    setSectionToScroll("tallas");
  }

  function updateCart(nextCart) {
    setCart(nextCart);
    try {
      localStorage.setItem("futrix-carrito", JSON.stringify(nextCart));
    } catch {
      // The cart remains usable for this visit if browser storage is unavailable.
    }
  }

  function addToCart(productId) {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    if ((cart[productId] || 0) >= product.stock) {
      setCartStatus(`Solo hay ${product.stock} unidades disponibles de esta referencia.`);
      setIsCartOpen(true);
      return;
    }

    updateCart({ ...cart, [productId]: (cart[productId] || 0) + 1 });
    setCartStatus("");
    setCartWhatsAppLink("");
    setIsCartOpen(true);
  }

  function changeQuantity(productId, amount) {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    const quantity = amount === 0 ? 0 : Math.min(product.stock, (cart[productId] || 0) + amount);
    const nextCart = { ...cart };
    if (quantity > 0) nextCart[productId] = quantity;
    else delete nextCart[productId];
    updateCart(nextCart);
    setCartStatus("");
    setCartWhatsAppLink("");
  }

  function clearCart() {
    updateCart({});
    setCartStatus("");
    setCartWhatsAppLink("");
  }

  async function orderOnWhatsApp(customer) {
    const items = Object.entries(cart)
      .map(([id, quantity]) => ({
        product: products.find((item) => item.id === id),
        quantity,
      }))
      .filter((item) => item.product);

    if (!items.length) return;

    const total = items.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0);
    const lines = items.map(({ product, quantity }) =>
      `${product.name}, talla ${product.size} x ${quantity}: ${formatPrice(product.price * quantity)} COP`,
    );
    const message = [
      "Hola, quiero hacer este pedido:",
      `Nombre: ${customer.name.trim()}`,
      `WhatsApp: ${customer.phone.trim()}`,
      customer.email?.trim() ? `Correo: ${customer.email.trim()}` : "",
      "",
      ...lines,
      `Total: ${formatPrice(total)} COP`,
    ].filter((line) => line !== "").join("\n");
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    const whatsappWindow = window.open("", "_blank");
    setCartStatus("Guardando tu pedido...");
    setCartWhatsAppLink("");
    try {
      await saveOrder({
        customer,
        items: items.map(({ product, quantity }) => ({
          productId: product.id,
          quantity,
        })),
      });
    } catch (error) {
      whatsappWindow?.close();
      setCartStatus(error.message);
      return false;
    }

    updateCart({});
    setCartStatus("Pedido guardado. Puedes revisar el mensaje de WhatsApp y confirmar el envío.");
    if (whatsappWindow) whatsappWindow.location.href = whatsappUrl;
    setCartWhatsAppLink(whatsappUrl);
    return true;
  }

  async function submitContact(event) {
    event.preventDefault();
    if (isContactSubmitting) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const contact = {
      name: data.get("nombre"),
      phone: data.get("telefono"),
      email: data.get("correo"),
      size: data.get("talla"),
      message: data.get("mensaje"),
    };
    const message = [
      `Hola, soy ${contact.name}.`,
      `Mi WhatsApp es ${contact.phone}.`,
      contact.email ? `Mi correo es ${contact.email}.` : "",
      `Me interesa la talla ${contact.size}.`,
      contact.message ? `Mensaje: ${contact.message}` : "",
    ].filter(Boolean).join("\n");
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    const whatsappWindow = window.open("", "_blank");
    setIsContactSubmitting(true);
    setContactStatus("Guardando tu mensaje...");
    setContactWhatsAppLink("");
    try {
      await saveContact(contact);
    } catch (error) {
      whatsappWindow?.close();
      setContactStatus(error.message);
      return;
    } finally {
      setIsContactSubmitting(false);
    }

    form.reset();
    setContactStatus("Mensaje guardado. Puedes revisar el mensaje de WhatsApp y confirmar el envío.");
    if (whatsappWindow) whatsappWindow.location.href = whatsappUrl;
    setContactWhatsAppLink(whatsappUrl);
  }

  return (
    <div className={`app-shell${selectedSize ? " vista-catalogo" : ""}`}>
      <header className="encabezado">
        <a className="marca" href={sitePath()}>
          <img className="marca-icono" src={sitePath("futrix-logo.svg")} alt="" />
          <span className="marca-nombre">Futrix<span>.</span></span>
        </a>
        <nav aria-label="Navegación principal">
          <a href={sitePath("#inicio")}>Inicio</a>
          <a href={sitePath("#tallas")}>Tallas</a>
          <a href={sitePath("#guia")}>Guía de tallas</a>
          <a href={sitePath("#cuidados")}>Cuidados</a>
          <a href={sitePath("#preguntas")}>Preguntas frecuentes</a>
          <a href={sitePath("#nosotros")}>Sobre Futrix</a>
        </nav>
        <UserAccount
          user={currentUser}
          onUserChange={setCurrentUser}
          isDialogOpen={isAccountDialogOpen}
          onDialogOpenChange={setIsAccountDialogOpen}
        />
      </header>

      <main>
        {showAdminPanel && <AdminPanel />}
        {selectedSize ? (
          <ProductCatalog
            size={selectedSize}
            products={visibleProducts}
            onSelectImage={setSelectedImage}
            onAdd={addToCart}
            onBackToSizes={returnToSizes}
          />
        ) : (
          <>
            <section className="portada" id="inicio">
              <p className="etiqueta etiqueta-portada"><IconoBalon /> Emprendimiento para porteros</p>
              <h1>Seguridad en tus manos. Futrix en la cancha.</h1>
              <p>Encuentra tus próximos guantes de fútbol. Elige la talla que necesitas y prepárate para atajar cada balón.</p>
              <a className="boton" href="#tallas">Ver tallas disponibles</a>
            </section>

            <section className="categorias" id="tallas">
              <p className="etiqueta">Encuentra tu ajuste ideal</p>
              <h2>Guantes por talla</h2>
              <div className="tarjetas">
                {availableSizes.map((size) => (
                  <a className="tarjeta tarjeta-talla" href={sitePath(`?talla=${size}#catalogo`)} key={size}>
                    <span className="icono" aria-hidden="true">🧤</span>
                    <p className="numero-talla">Talla {size}</p>
                    <h3>Guantes Golty</h3>
                    <p>Desde {formatPrice(pricesBySize[size])} COP · Ver modelos</p>
                  </a>
                ))}
              </div>
            </section>

            <section className="informacion" id="guia">
              <p className="etiqueta">Un buen ajuste hace la diferencia</p>
              <h2>Guía para elegir tu talla</h2>
              <div className="tarjetas tarjetas-info">
                <article className="tarjeta">
                  <h3>Mide tu mano</h3>
                  <p>Mide alrededor de la palma, justo debajo de los nudillos y sin incluir el pulgar.</p>
                </article>
                <article className="tarjeta">
                  <h3>Compara la medida</h3>
                  <p>Usa la guía de tallas del fabricante del guante. Las medidas pueden variar entre modelos.</p>
                </article>
                <article className="tarjeta">
                  <h3>Busca un ajuste cómodo</h3>
                  <p>El guante debe quedar firme, pero permitirte mover los dedos con comodidad.</p>
                </article>
              </div>
            </section>

            <section className="informacion informacion-alterna" id="cuidados">
              <p className="etiqueta">Cuida tus guantes</p>
              <h2>Consejos para mantenerlos en buen estado</h2>
              <div className="tarjetas tarjetas-info">
                <article className="tarjeta">
                  <h3>Límpialos con cuidado</h3>
                  <p>Después de usarlos, sigue las indicaciones de limpieza del fabricante.</p>
                </article>
                <article className="tarjeta">
                  <h3>Déjalos secar al aire</h3>
                  <p>Evita el calor directo y el sol intenso para ayudar a conservar sus materiales.</p>
                </article>
                <article className="tarjeta">
                  <h3>Guárdalos secos</h3>
                  <p>Cuando estén completamente secos, guárdalos en un lugar limpio y ventilado.</p>
                </article>
              </div>
            </section>

            <section className="informacion" id="preguntas">
              <p className="etiqueta">Resolvemos tus dudas</p>
              <h2>Preguntas frecuentes</h2>
              <div className="tarjetas tarjetas-info preguntas">
                <article className="tarjeta">
                  <h3>¿Qué tallas tiene Futrix?</h3>
                  <p>Tenemos guantes en tallas 5, 6, 7 y 8.</p>
                </article>
                <article className="tarjeta">
                  <h3>¿Cómo sé cuál me queda?</h3>
                  <p>Mide tu palma y compara el resultado con la guía del fabricante del modelo.</p>
                </article>
                <article className="tarjeta">
                  <h3>¿Para quién son los guantes?</h3>
                  <p>Nuestra tienda está pensada para niños y jóvenes que quieren jugar con confianza.</p>
                </article>
              </div>
            </section>

            <section className="nosotros" id="nosotros">
              <div className="nosotros-contenido">
                <div className="nosotros-texto">
                  <p className="etiqueta">Nuestra pasión es defender</p>
                  <h2>Futrix: pasión por el arco</h2>
                  <p>Somos un emprendimiento dedicado a la venta de guantes de fútbol para niños y jóvenes que quieren jugar con confianza y sentirse seguros bajo los tres palos.</p>
                  <p>En Futrix creemos que cada portero merece guantes cómodos y de calidad. Contamos con tallas 5, 6, 7 y 8 para que encuentres el ajuste ideal.</p>
                  <div className="nosotros-valores">
                    <div className="nosotros-valor">
                      <span className="nosotros-valor-icono" aria-hidden="true">🧤</span>
                      <span>Para cada portero</span>
                    </div>
                    <div className="nosotros-valor">
                      <span className="nosotros-valor-icono" aria-hidden="true"><IconoBalon /></span>
                      <span>Pasión por el fútbol</span>
                    </div>
                    <div className="nosotros-valor">
                      <span className="nosotros-valor-icono" aria-hidden="true">🥅</span>
                      <span>Listos para atajar</span>
                    </div>
                  </div>
                  <p className="nosotros-cierre">Gracias por apoyar nuestro emprendimiento. ¡Nos vemos en la cancha!</p>
                </div>
                <div className="nosotros-visual">
                  <img
                    className="nosotros-guantes"
                    src={sitePath("imagenes-guantes/guante-01.jpeg")}
                    alt="Guantes de portero Golty disponibles en Futrix"
                    loading="lazy"
                  />
                  <div className="nosotros-insignia">
                    <img src={sitePath("futrix-logo.svg")} alt="" />
                    <span>Confianza en cada atajada</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="contacto" id="contacto">
              <p className="etiqueta">Hablemos de tu próximo atajadón</p>
              <h2>Déjanos tus datos</h2>
              <form className="formulario-contacto" onSubmit={submitContact}>
                <label>
                  Nombre completo
                  <input type="text" name="nombre" autoComplete="name" minLength="2" maxLength="100" required disabled={isContactSubmitting} />
                </label>
                <label>
                  Tu WhatsApp
                  <input type="tel" name="telefono" autoComplete="tel" minLength="7" maxLength="20" required disabled={isContactSubmitting} />
                </label>
                <label>
                  Correo electrónico
                  <input type="email" name="correo" autoComplete="email" maxLength="254" required disabled={isContactSubmitting} />
                </label>
                <label>
                  Talla que te interesa
                  <select name="talla" defaultValue="" required disabled={isContactSubmitting}>
                    <option value="" disabled>Selecciona una talla</option>
                    {availableSizes.map((size) => <option value={size} key={size}>Talla {size}</option>)}
                  </select>
                </label>
                <label className="campo-mensaje">
                  ¿En qué podemos ayudarte?
                  <textarea name="mensaje" rows="4" minLength="2" maxLength="2000" required disabled={isContactSubmitting} />
                </label>
                <button className="boton" type="submit" disabled={isContactSubmitting}>
                  {isContactSubmitting ? "Guardando..." : "Abrir WhatsApp para enviar"}
                </button>
                <p className="aviso-contacto">WhatsApp abrirá un mensaje con tus datos; tendrás que confirmar el envío.</p>
                {contactStatus && <p className="estado-formulario" role="status">{contactStatus}</p>}
                {contactWhatsAppLink && (
                  <a className="boton enlace-whatsapp" href={contactWhatsAppLink} target="_blank" rel="noopener noreferrer">
                    Abrir WhatsApp para enviar tus datos
                  </a>
                )}
              </form>
            </section>
          </>
        )}
      </main>

      {!selectedSize && (
        <footer className="pie">
          <div className="pie-contenido">
            <div className="pie-marca">
              <a className="marca" href={sitePath()}>
                <img className="marca-icono" src={sitePath("futrix-logo.svg")} alt="" />
                <span className="marca-nombre">Futrix<span>.</span></span>
              </a>
              <p>Confianza y seguridad para defender cada balón.</p>
            </div>
            <nav className="pie-enlaces" aria-label="Enlaces del pie de página y redes sociales">
              <a href={sitePath("#tallas")}>Ver tallas</a>
              <a href={sitePath("#guia")}>Guía de tallas</a>
              <a href={sitePath("#cuidados")}>Cuidados</a>
              <a href={sitePath("#preguntas")}>Preguntas frecuentes</a>
              <a href={sitePath("#nosotros")}>Sobre Futrix</a>
              <a href={sitePath("#inicio")}>Volver arriba</a>
              <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer">WhatsApp: 300 222 1220</a>
              <a href="https://www.tiktok.com/@leonidasrdqrz?_r=1&amp;_t=ZS-9ARPBqaKVPh" target="_blank" rel="noopener noreferrer">TikTok</a>
            </nav>
          </div>
          <div className="pie-final">
            <p>&copy; Futrix. Todos los derechos reservados.</p>
            <p>Listos para la próxima atajada.</p>
          </div>
        </footer>
      )}

      <ShoppingCart
        items={Object.entries(cart).map(([id, quantity]) => ({
          product: products.find((product) => product.id === id),
          quantity,
        })).filter((item) => item.product)}
        onChangeQuantity={changeQuantity}
        onClear={clearCart}
        onOrder={orderOnWhatsApp}
        status={cartStatus}
        whatsappLink={cartWhatsAppLink}
        isOpen={isCartOpen}
        onToggle={() => setIsCartOpen((open) => !open)}
        onClose={() => setIsCartOpen(false)}
        isAuthenticated={Boolean(currentUser)}
        customer={currentUser}
        onRequireLogin={() => setIsAccountDialogOpen(true)}
      />
      <ChatWidget />
      <ImageViewer product={selectedImage} onClose={() => setSelectedImage(null)} />
    </div>
  );
}

export default App;
