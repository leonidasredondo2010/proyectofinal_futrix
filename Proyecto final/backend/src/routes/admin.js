import { Router } from "express";
import { Contact } from "../database/models/Contact.js";
import { Order } from "../database/models/Order.js";

const router = Router();
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "futrix123";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "futrix-admin-token";

function requireAdmin(request, response, next) {
  const authorization = request.headers.authorization || "";
  if (authorization === `Bearer ${ADMIN_TOKEN}`) {
    return next();
  }
  return response.status(401).json({ error: "No autorizado." });
}

router.post("/login", async (request, response) => {
  const { username, password } = request.body ?? {};

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return response.json({ success: true, token: ADMIN_TOKEN });
  }

  return response.status(401).json({ error: "Credenciales inválidas." });
});

router.get("/summary", requireAdmin, async (_request, response) => {
  const [orders, contacts] = await Promise.all([
    Order.find({}).sort({ createdAt: -1 }).lean(),
    Contact.find({}).sort({ createdAt: -1 }).lean(),
  ]);

  response.json({
    totals: {
      orders: orders.length,
      contacts: contacts.length,
    },
    orders,
    contacts,
  });
});

router.get("/orders", requireAdmin, async (_request, response) => {
  const orders = await Order.find({}).sort({ createdAt: -1 }).lean();
  response.json({ orders });
});

router.get("/contacts", requireAdmin, async (_request, response) => {
  const contacts = await Contact.find({}).sort({ createdAt: -1 }).lean();
  response.json({ contacts });
});

export default router;
