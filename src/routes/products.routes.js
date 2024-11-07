import express from "express";
import Product from "../models/product.model.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const { page = 1, limit = 5, category, sort = "asc" } = req.query;
  const query = category ? { category } : {};
  const sortOrder = sort === "asc" ? 1 : -1;

  try {
    const products = await Product.find(query)
      .sort({ price: sortOrder })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    res.json({
      status: "success",
      payload: products,
      totalPages,
      page: Number(page),
      hasPrevPage: page > 1,
      hasNextPage: page < totalPages,
      prevPage: page > 1 ? Number(page) - 1 : null,
      nextPage: page < totalPages ? Number(page) + 1 : null,
    });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res
      .status(500)
      .json({ status: "error", error: "Error al obtener productos" });
  }
});

router.get("/:pid", async (req, res) => {
  const { pid } = req.params;
  try {
    const product = await Product.findById(pid);
    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res.json(product);
  } catch (error) {
    console.error("Error al obtener el producto:", error);
    res.status(500).json({ error: "Error al obtener el producto" });
  }
});

export default router;
