import { useRef, useState } from "react";
import { formatPrice, pricesBySize } from "../../../../shared/catalog.js";
import { useCloseOnOutside } from "../../hooks/useCloseOnOutside";

const quickQuestions = [
  "¿Qué tallas de guantes se encuentran disponibles?",
  "¿Cuál es el precio de los guantes?",
  "¿Cómo puedo realizar un pedido?",
];

const initialGreeting = {
  type: "bot",
  text: "¡Hola! Puedo ayudarte con tallas, precios y pedidos. ¿Qué te gustaría saber?",
};

function getReply(question) {
  const text = question.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const size = text.match(/\b(5|6|7|8)\b/)?.[1];
  const answers = [];
  const add = (matches, answer) => {
    if (matches) answers.push(answer);
  };
  const sizeLink = size
    ? { href: `/?talla=${size}#catalogo`, label: `Ver guantes talla ${size}` }
    : { href: "/#tallas", label: "Ver tallas y modelos" };

  add(/\b(quienes somos|quienes son|quien es futrix|que es futrix|sobre futrix|historia de futrix|emprendimiento|negocio)\b/.test(text), {
    text: "Futrix es un emprendimiento dedicado a ofrecer guantes de fútbol para niños y jóvenes. Queremos que cada portero juegue con confianza y se sienta seguro bajo los tres palos.",
    link: { href: "/#nosotros", label: "Conocer más sobre Futrix" },
  });
  add(/\b(que venden|que vende|que productos|que ofrecen|que tipos|venden|producto|productos|tipo|tipos|modelo|modelos|referencia|fotos|imagenes)\b/.test(text), {
    text: "Vendemos guantes de portero Golty. Hay 12 referencias disponibles y puedes ver sus fotos en las tallas 5, 6, 7 y 8.",
    link: sizeLink,
  });
  add(/\b(para quien|para quienes|ninos|ninas|jovenes|porteros|porteras|edad)\b/.test(text), {
    text: "La tienda está pensada para niños y jóvenes que juegan de portero y quieren sentirse seguros en la cancha.",
    link: { href: "/#nosotros", label: "Conocer Futrix" },
  });
  if (/\b(precio|precios|cuesta|cuestan|valor|valen|cobran|cuanto cuesta|cuanto cuestan|cuanto vale|cuanto valen|cuanto es)\b/.test(text)) {
    add(true, size
      ? {
          text: `Los guantes talla ${size} cuestan ${formatPrice(pricesBySize[size])} COP.`,
          link: sizeLink,
        }
      : {
          text: `Los precios son: talla 5, ${formatPrice(pricesBySize[5])}; talla 6, ${formatPrice(pricesBySize[6])}; talla 7, ${formatPrice(pricesBySize[7])}; y talla 8, ${formatPrice(pricesBySize[8])} COP.`,
          link: { href: "/#tallas", label: "Elegir una talla" },
        });
  }
  add(/\b(talla|tallas|medir|medida|guia|mano|palma|ajuste|queda|quede)\b/.test(text), {
    text: "Tenemos tallas 5, 6, 7 y 8. Para elegir, mide alrededor de la palma justo debajo de los nudillos, sin incluir el pulgar; consulta también la guía del fabricante, porque las medidas pueden variar según el modelo. El guante debe quedar firme y permitir mover los dedos con comodidad.",
    link: size
      ? sizeLink
      : { href: "/#guia", label: "Consultar guía de tallas" },
  });
  add(/\b(cuidar|cuidado|limpiar|limpieza|lavar|secar|guardar|conservar)\b/.test(text), {
    text: "Para cuidar tus guantes, sigue las indicaciones de limpieza del fabricante, déjalos secar al aire sin calor directo ni sol intenso y guárdalos secos en un lugar limpio y ventilado.",
    link: { href: "/#cuidados", label: "Ver consejos de cuidado" },
  });
  add(/\b(pedido|pedir|comprar|compra|whatsapp|pago|envio|entrega|domicilio)\b/.test(text), {
    text: "Para hacer un pedido, elige una talla, agrega los guantes al carrito y pulsa «Pedir por WhatsApp». Se abrirá un mensaje con tu pedido para que lo revises y confirmes el envío.",
    link: { href: "https://wa.me/573002221220", label: "Contactar por WhatsApp", external: true },
  });
  add(/\b(contacto|contactar|comunic|telefono|correo|email|instagram|tiktok|redes|direccion|ubicacion)\b/.test(text), {
    text: "Puedes escribirnos por WhatsApp al 300 222 1220. También encontrarás el enlace a nuestras redes sociales al final de la página.",
    link: { href: "https://wa.me/573002221220", label: "Escribir por WhatsApp", external: true },
  });

  if (!answers.length && /\b(hola|buenas|buenos dias|buenas tardes|buenas noches)\b/.test(text)) {
    return { text: "¡Hola! Soy el asistente de Futrix. Puedo ayudarte con nuestros productos, tallas, precios, cuidados y pedidos. ¿Qué quieres saber?" };
  }
  if (!answers.length) {
    return {
      text: "Puedo responder preguntas sobre quiénes somos, qué vendemos, tallas, precios, cómo elegir o cuidar los guantes y cómo hacer un pedido. Si necesitas confirmar un dato específico, escríbenos por WhatsApp.",
      link: { href: "https://wa.me/573002221220", label: "Contactar por WhatsApp", external: true },
    };
  }

  return {
    text: answers.map((answer) => answer.text).join("\n\n"),
    link: answers[answers.length - 1].link,
  };
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([initialGreeting]);
  const chatRef = useRef(null);
  useCloseOnOutside(chatRef, isOpen, () => setIsOpen(false));

  function sendMessage(message) {
    const value = message.trim();
    if (!value) return;
    const reply = getReply(value);
    setMessages((current) => [
      ...current,
      { type: "usuario", text: value },
      { type: "bot", ...reply },
    ]);
    setQuestion("");
  }

  return (
    <div className="chatbot-flotante" ref={chatRef}>
      {isOpen && (
        <section className="chatbot-panel" aria-label="Chat de ayuda de Futrix">
          <header className="chatbot-cabecera">
            <div>
              <h2>Asistente Futrix</h2>
              <p>Resuelve tus dudas sobre los guantes</p>
            </div>
            <span className="chatbot-estado">En línea</span>
            <button
              className="chatbot-limpiar"
              type="button"
              onClick={() => {
                setMessages([initialGreeting]);
                setQuestion("");
              }}
            >
              Vaciar chat
            </button>
          </header>
          <div className="chat-mensajes" aria-live="polite" aria-relevant="additions">
            {messages.map((message, index) => (
              <p className={`chat-mensaje chat-mensaje-${message.type}`} key={`${index}-${message.text}`}>
                {message.text}
                {message.link && (
                  <>
                    <br />
                    <a href={message.link.href} {...(message.link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                      {message.link.label}
                    </a>
                  </>
                )}
              </p>
            ))}
          </div>
          <div className="chat-preguntas" aria-label="Preguntas frecuentes">
            {quickQuestions.map((item) => (
              <button key={item} type="button" onClick={() => sendMessage(item)}>
                {item}
              </button>
            ))}
          </div>
          <form
            className="chat-formulario"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage(question);
            }}
          >
            <label className="visualmente-oculto" htmlFor="chat-entrada">Escribe tu pregunta</label>
            <input
              id="chat-entrada"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Escribe tu pregunta..."
              autoComplete="off"
              required
            />
            <button type="submit" aria-label="Enviar mensaje">Enviar</button>
          </form>
        </section>
      )}
      <button
        className="chatbot-boton"
        type="button"
        aria-label={isOpen ? "Cerrar el chat de ayuda" : "Abrir el chat de ayuda"}
        aria-expanded={isOpen}
        title="Chat de ayuda"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span aria-hidden="true">💬</span>
      </button>
    </div>
  );
}
