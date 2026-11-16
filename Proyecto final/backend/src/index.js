import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import { fileURLToPath } from "node:url";
import path from "node:path";
import ordersRouter from "./routes/orders.js";
import contactsRouter from "./routes/contacts.js";
import adminRouter from "./routes/admin.js";
import authRouter from "./routes/auth.js";
import { ApiError, asyncHandler } from "./errors.js";
import { connectToDatabase } from "./database/connection.js";

const app = express();
const port = Number(process.env.PORT) || 3001;
const distDirectory = fileURLToPath(new URL("../../dist/", import.meta.url));

app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));

app.get(
  "/api/health",
  asyncHandler(async (_request, response) => {
    await connectToDatabase();
    response.json({ status: "ok", database: mongoose.connection.name });
  }),
);
app.use("/api/orders", ordersRouter);
app.use("/api/contacts", contactsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);

app.use("/api", (_request, _response, next) => {
  next(new ApiError(404, "La ruta solicitada no existe."));
});

app.use(express.static(distDirectory));
app.get(/.*/, (_request, response, next) => {
  response.sendFile(path.join(distDirectory, "index.html"), (error) => {
    if (error) next(error);
  });
});

app.use((error, _request, response, _next) => {
  if (response.headersSent) return _next(error);

  if (error?.type === "entity.too.large") {
    return response.status(413).json({ error: "La solicitud supera el tamaño permitido." });
  }

  if (error instanceof ApiError) {
    return response.status(error.status).json({ error: error.message });
  }

  if (error instanceof SyntaxError && "body" in error) {
    return response.status(400).json({ error: "El cuerpo de la solicitud no es un JSON válido." });
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return response.status(400).json({ error: "Los datos no cumplen con el formato requerido." });
  }

  console.error("Error en la API:", error.message);
  return response.status(500).json({ error: "Ocurrió un error interno. Inténtalo más tarde." });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`API Futrix escuchando en el puerto ${port}`);
  connectToDatabase()
    .then(() => console.log(`Conectado a MongoDB: ${mongoose.connection.name}`))
    .catch((error) => console.error(error.message));
});
