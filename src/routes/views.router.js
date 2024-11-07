import express from "express";
import Product from "../models/product.model.js";
import Cart from "../models/cart.model.js";

const router = express.Router();

router.get("/products", async (req, res) => {
  const { query, sort } = req.query;

  const filter = query ? { category: query } : {};

  const sortOption =
    sort === "asc" ? { price: 1 } : sort === "desc" ? { price: -1 } : {};

  try {
    const products = await Product.find(filter).sort(sortOption);

    const categories = await Product.distinct("category");

    const categoriesWithSelected = categories.map((category) => ({
      name: category,
      selected: category === query,
    }));

    res.render("products", {
      products,
      categories: categoriesWithSelected,
      selectedQuery: query || "",
      isSortAsc: sort === "asc",
      isSortDesc: sort === "desc",
    });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).send("Error al obtener productos");
  }
});

router.get("/products", async (req, res) => {
  try {
    const { limit = 10, page = 1, sort, query } = req.query;
    const options = {
      limit: parseInt(limit),
      page: parseInt(page),
      sort: sort ? { price: sort === "asc" ? 1 : -1 } : undefined,
    };
    const filter = query ? { category: query } : {};
    const products = await Product.paginate(filter, options);

    res.render("products", {
      products: products.docs,
      totalPages: products.totalPages,
      page: products.page,
      hasPrevPage: products.hasPrevPage,
      hasNextPage: products.hasNextPage,
      prevPage: products.hasPrevPage ? products.page - 1 : null,
      nextPage: products.hasNextPage ? products.page + 1 : null,
    });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).send("Error al obtener productos");
  }
});

router.get("/products/:pid", async (req, res) => {
  const product = await Product.findById(req.params.pid);
  res.render("productDetails", product);
});

router.get("/cart", async (req, res) => {
  try {
    const cart = await Cart.findById(req.session.cartId).populate(
      "products.product"
    );
    if (!cart) {
      return res.render("cart", { products: [] });
    }

    res.render("cart", { products: cart.products });
  } catch (error) {
    console.error("Error al cargar el carrito:", error);
    res.status(500).send("Error al cargar el carrito");
  }
});

router.get("/cart", async (req, res) => {
  try {
    let cartId = req.query.cartId;

    let cart = cartId ? await Cart.findById(cartId) : null;

    if (!cart) {
      cart = await Cart.create({ products: [] });
      cartId = cart._id;
    }

    res.redirect(`/cart/${cartId}`);
  } catch (error) {
    console.error("Error al cargar el carrito:", error);
    res.status(500).send("Error al cargar el carrito");
  }
});

router.get("/cart/:cid", async (req, res) => {
  const { cid } = req.params;

  try {
    const cart = await Cart.findById(cid).populate("products.product");
    if (!cart) {
      return res.status(404).send("Carrito no encontrado");
    }

    res.render("cart", {
      products: cart.products,
      cartId: cart._id,
    });
  } catch (error) {
    console.error("Error al mostrar el carrito:", error);
    res.status(500).send("Error al mostrar el carrito");
  }
});

export default router;
