import { Router } from "express";
import { connectToDatabase } from "../database/connection.js";
import { ApiError, asyncHandler } from "../errors.js";
import { Contact } from "../database/models/Contact.js";

const router = Router();
const validSizes = new Set(["5", "6", "7", "8"]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+()\d\s.-]{7,20}$/;

router.post(
  "/",
  asyncHandler(async (request, response) => {
    const { name, phone, email, size, message } = request.body ?? {};
    if (
      typeof name !== "string"
      || name.trim().length < 2
      || name.trim().length > 100
      || typeof phone !== "string"
      || !phonePattern.test(phone.trim())
      || typeof email !== "string"
      || email.length > 254
      || !emailPattern.test(email.trim())
      || !validSizes.has(size)
      || typeof message !== "string"
      || message.trim().length < 2
      || message.trim().length > 2000
    ) {
      throw new ApiError(400, "Revisa los datos del formulario e inténtalo de nuevo.");
    }

    await connectToDatabase();
    const contact = await Contact.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      size,
      message: message.trim(),
    });

    response.status(201).json({ id: contact.id, message: "Mensaje guardado." });
  }),
);

export default router;
