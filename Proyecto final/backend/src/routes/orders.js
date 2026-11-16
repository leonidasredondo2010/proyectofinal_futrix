import { Router } from "express";
import { products } from "../../../shared/catalog.js";
import { connectToDatabase } from "../database/connection.js";
import { asyncHandler, ApiError } from "../errors.js";
import { Order } from "../database/models/Order.js";
import { findSessionUser } from "./auth.js";

const router = Router();
const productsById = new Map(products.map((product) => [product.id, product]));

router.post(
  "/",
  asyncHandler(async (request, response) => {
    const user = await findSessionUser(request, response);
    if (!user) throw new ApiError(401, "Inicia sesión para realizar una compra.");

    const { items, customer } = request.body ?? {};
    if (!Array.isArray(items) || items.length === 0 || items.length > 48) {
      throw new ApiError(400, "El pedido debe incluir entre 1 y 48 productos.");
    }

    const email = typeof customer?.email === "string" ? customer.email.trim() : "";
    if (
      typeof customer?.name !== "string"
      || customer.name.trim().length < 2
      || customer.name.trim().length > 100
      || typeof customer.phone !== "string"
      || !/^[+()\d\s.-]{7,20}$/.test(customer.phone.trim())
      || (customer.email !== undefined && typeof customer.email !== "string")
      || email.length > 254
      || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    ) {
      throw new ApiError(400, "Escribe un nombre y un número de WhatsApp válidos; revisa también el correo.");
    }

    const seenProducts = new Set();
    const orderItems = items.map((item) => {
      if (!item || typeof item.productId !== "string" || !Number.isInteger(item.quantity)) {
        throw new ApiError(400, "Cada producto debe tener una referencia y una cantidad válida.");
      }

      const product = productsById.get(item.productId);
      if (!product || item.quantity < 1 || item.quantity > 50 || seenProducts.has(item.productId)) {
        throw new ApiError(400, "El pedido contiene un producto o una cantidad no válida.");
      }
      seenProducts.add(item.productId);

      return {
        productId: product.id,
        name: product.name,
        size: product.size,
        reference: product.reference,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal: product.price * item.quantity,
      };
    });

    await connectToDatabase();
    const order = await Order.create({
      userId: user.id,
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        ...(email ? { email: email.toLowerCase() } : {}),
      },
      items: orderItems,
      total: orderItems.reduce((sum, item) => sum + item.subtotal, 0),
    });

    response.status(201).json({ id: order.id, message: "Pedido guardado." });
  }),
);

export default router;
