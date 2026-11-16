async function postJson(path, data) {
  let response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    throw new Error("No se pudo contactar con la API local. Comprueba que el servidor esté iniciado.");
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || "No se pudo guardar la información.");
  }
  return result;
}

async function getJson(path, token) {
  let response;
  try {
    response = await fetch(path, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    throw new Error("No se pudo contactar con la API local. Comprueba que el servidor esté iniciado.");
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || "No se pudo cargar la información.");
  }
  return result;
}

export function saveOrder(order) {
  return postJson("/api/orders", order);
}

export function saveContact(contact) {
  return postJson("/api/contacts", contact);
}

export function adminLogin(credentials) {
  return postJson("/api/admin/login", credentials);
}

export function registerUser(user) {
  return postJson("/api/auth/register", user);
}

export function loginUser(credentials) {
  return postJson("/api/auth/login", credentials);
}

export function logoutUser() {
  return postJson("/api/auth/logout", {});
}

export function getCurrentUser() {
  return getJson("/api/auth/me");
}

export function getAdminSummary(token) {
  return getJson("/api/admin/summary", token);
}
