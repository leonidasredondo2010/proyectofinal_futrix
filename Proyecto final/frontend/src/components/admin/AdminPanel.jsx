import { useEffect, useState } from "react";
import { adminLogin, getAdminSummary } from "../../services/api";

const defaultCredentials = { username: "admin", password: "" };

export default function AdminPanel() {
  const [credentials, setCredentials] = useState(defaultCredentials);
  const [token, setToken] = useState(() => localStorage.getItem("futrix-admin-token") || "");
  const [status, setStatus] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [summary, setSummary] = useState({ totals: { orders: 0, contacts: 0 }, orders: [], contacts: [] });

  const isAuthenticated = Boolean(token);

  useEffect(() => {
    if (!token) return undefined;

    let isActive = true;
    getAdminSummary(token)
      .then((response) => {
        if (!isActive) return;
        setSummary(response);
        setStatus("Panel listo.");
      })
      .catch((error) => {
        if (!isActive) return;
        setStatus(error.message);
        setToken("");
        localStorage.removeItem("futrix-admin-token");
      });

    return () => {
      isActive = false;
    };
  }, [token]);

  async function handleLogin(event) {
    event.preventDefault();
    setIsBusy(true);
    setStatus("Validando credenciales...");

    try {
      const response = await adminLogin(credentials);
      setToken(response.token);
      localStorage.setItem("futrix-admin-token", response.token);
      setStatus("Sesión iniciada correctamente.");
    } catch (error) {
      setStatus(error.message);
      setToken("");
      localStorage.removeItem("futrix-admin-token");
    } finally {
      setIsBusy(false);
    }
  }

  function handleLogout() {
    setToken("");
    setSummary({ totals: { orders: 0, contacts: 0 }, orders: [], contacts: [] });
    setStatus("Sesión cerrada.");
    localStorage.removeItem("futrix-admin-token");
  }

  if (!isAuthenticated) {
    return (
      <section className="admin-panel admin-login" id="admin" aria-label="Panel administrativo de Futrix">
        <div className="admin-card">
          <p className="etiqueta">Administración</p>
          <h2>Acceso al panel</h2>
          <form onSubmit={handleLogin} className="admin-form">
            <label>
              Usuario
              <input
                type="text"
                value={credentials.username}
                onChange={(event) => setCredentials((current) => ({ ...current, username: event.target.value }))}
                autoComplete="username"
                required
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                value={credentials.password}
                onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
                autoComplete="current-password"
                required
              />
            </label>
            <button className="boton" type="submit" disabled={isBusy}>
              {isBusy ? "Validando..." : "Entrar al panel"}
            </button>
          </form>
          {status && <p className="estado-formulario" role="status">{status}</p>}
        </div>
      </section>
    );
  }

  return (
    <section className="admin-panel" aria-label="Panel de gestión de Futrix">
      <div className="admin-header">
        <div>
          <p className="etiqueta">Administración</p>
          <h2>Panel de gestión</h2>
        </div>
        <button className="boton-vaciar" type="button" onClick={handleLogout}>Cerrar sesión</button>
      </div>

      {status && <p className="estado-formulario" role="status">{status}</p>}

      <div className="admin-overview">
        <article className="admin-stat">
          <span>Pedidos</span>
          <strong>{summary.totals.orders}</strong>
        </article>
        <article className="admin-stat">
          <span>Solicitudes de contacto</span>
          <strong>{summary.totals.contacts}</strong>
        </article>
      </div>

      <div className="admin-grid">
        <article className="admin-card">
          <h3>Pedidos recientes</h3>
          {summary.orders.length ? (
            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>WhatsApp</th>
                    <th>Total</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.orders.map((order) => (
                    <tr key={order._id || order.id}>
                      <td>{order.customer?.name || "Sin nombre"}</td>
                      <td>{order.customer?.phone || "Sin dato"}</td>
                      <td>{new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(order.total || 0)}</td>
                      <td>{order.createdAt ? new Date(order.createdAt).toLocaleString("es-CO") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-empty">Aún no hay pedidos registrados.</p>
          )}
        </article>

        <article className="admin-card">
          <h3>Mensajes de contacto</h3>
          {summary.contacts.length ? (
            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Talla</th>
                    <th>Correo</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.contacts.map((contact) => (
                    <tr key={contact._id || contact.id}>
                      <td>{contact.name}</td>
                      <td>{contact.size}</td>
                      <td>{contact.email}</td>
                      <td>{contact.createdAt ? new Date(contact.createdAt).toLocaleString("es-CO") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-empty">Aún no hay consultas.</p>
          )}
        </article>
      </div>
    </section>
  );
}
