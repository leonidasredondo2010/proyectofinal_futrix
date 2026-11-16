import mongoose from "mongoose";
import { ApiError } from "../errors.js";

let connectionPromise;

export async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) return;

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/futrix",
      { serverSelectionTimeoutMS: 2000 },
    );
  }

  try {
    await connectionPromise;
  } catch {
    throw new ApiError(
      503,
      "No se pudo conectar con MongoDB local. Comprueba que MongoDB esté instalado e iniciado.",
    );
  } finally {
    connectionPromise = undefined;
  }
}
