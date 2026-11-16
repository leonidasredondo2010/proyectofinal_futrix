import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { getCurrentUser, loginUser, logoutUser, registerUser } from "../services/api";

export default function UserAccount({ user, onUserChange, isDialogOpen, onDialogOpenChange }) {
  const [mode, setMode] = useState("login");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let isActive = true;
    getCurrentUser()
      .then(({ user: currentUser }) => {
        if (isActive) onUserChange(currentUser);
      })
      .catch((error) => {
        if (isActive) setStatus(error.message);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [onUserChange]);

  useEffect(() => {
    if (!isDialogOpen) return undefined;

    function closeOnEscape(event) {
      if (event.key === "Escape") onDialogOpenChange(false);
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isDialogOpen, onDialogOpenChange]);

  async function submitAccount(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("");
    const formData = new FormData(event.currentTarget);
    const accountData = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    try {
      const result = mode === "register"
        ? await registerUser({ ...accountData, name: formData.get("name") })
        : await loginUser(accountData);
      onUserChange(result.user);
      onDialogOpenChange(false);
      setStatus(mode === "register" ? "Tu cuenta se creó correctamente." : "Sesión iniciada.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signOut() {
    setStatus("");
    setIsSigningOut(true);
    try {
      await logoutUser();
      onUserChange(null);
      setStatus("Sesión cerrada.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsSigningOut(false);
    }
  }

  function openDialog() {
    setMode("login");
    setStatus("");
    onDialogOpenChange(true);
  }

  return (
    <div className="cuenta-control">
      {user ? (
        <button className="cuenta-boton cuenta-secundario" type="button" onClick={signOut} disabled={isSigningOut}>
          {isSigningOut ? "Cerrando sesión..." : "Cerrar sesión"}
        </button>
      ) : (
        <button className="cuenta-boton" type="button" onClick={openDialog} disabled={isLoading}>
          {isLoading ? "Cargando..." : "Iniciar sesión"}
        </button>
      )}
      {status && !isDialogOpen && <span className="cuenta-estado" role="status">{status}</span>}
      {isDialogOpen && createPortal(
        <div className="cuenta-overlay">
          <section className="cuenta-dialogo" role="dialog" aria-modal="true" aria-labelledby="cuenta-titulo">
            <button
              className="cuenta-cerrar"
              type="button"
              aria-label="Cerrar"
              onClick={() => onDialogOpenChange(false)}
            >
              ×
            </button>
            <p className="etiqueta">Tu cuenta Futrix</p>
            <h2 id="cuenta-titulo">{mode === "register" ? "Crear una cuenta" : "Iniciar sesión"}</h2>
            <form className="cuenta-formulario" key={mode} onSubmit={submitAccount}>
              {mode === "register" && (
                <label>
                  Nombre completo
                  <input
                    name="name"
                    type="text"
                    autoComplete="name"
                    minLength="2"
                    maxLength="100"
                    required
                  />
                </label>
              )}
              <label>
                Correo electrónico
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength="254"
                  required
                />
              </label>
              <label>
                Contraseña
                <input
                  name="password"
                  type="password"
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  minLength={mode === "register" ? "8" : "1"}
                  maxLength="128"
                  required
                />
                {mode === "register" && <span className="cuenta-ayuda">Debe tener al menos 8 caracteres.</span>}
              </label>
              <button className="boton" type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Procesando..."
                  : mode === "register" ? "Crear cuenta" : "Entrar"}
              </button>
            </form>
            <p className="cuenta-cambio">
              {mode === "register" ? "¿Ya tienes una cuenta?" : "¿Aún no tienes una cuenta?"}
              {" "}
              <button
                type="button"
                onClick={() => {
                  setMode((current) => current === "register" ? "login" : "register");
                  setStatus("");
                }}
              >
                {mode === "register" ? "Inicia sesión" : "Regístrate"}
              </button>
            </p>
            {status && <p className="cuenta-estado cuenta-estado-dialogo" role="status">{status}</p>}
          </section>
        </div>,
        document.body,
      )}
    </div>
  );
}
