export const availableSizes = ["5", "6", "7", "8"];

export const pricesBySize = {
  5: 69900,
  6: 74900,
  7: 79900,
  8: 84900,
};

const stockBySize = {
  5: [6, 9, 4, 12, 7, 5, 10, 8, 3, 11, 6, 9],
  6: [8, 5, 11, 6, 9, 4, 12, 7, 10, 3, 8, 5],
  7: [4, 10, 7, 5, 11, 8, 3, 9, 6, 12, 5, 10],
  8: [9, 6, 12, 8, 4, 10, 7, 5, 11, 6, 3, 8],
};

export const products = availableSizes.flatMap((size) =>
  Array.from({ length: 12 }, (_, index) => {
    const reference = String(index + 1).padStart(2, "0");

    return {
      id: `golty-${size}-${reference}`,
      size,
      reference,
      image: `/imagenes-guantes/guante-${reference}.jpeg`,
      price: pricesBySize[size],
      name: `Golty - Referencia ${reference}`,
      stock: stockBySize[size][index],
    };
  }),
);

export const formatPrice = (price) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(price);
