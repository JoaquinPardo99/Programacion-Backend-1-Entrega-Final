import express from "express";
import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";

const router = express.Router();

router.get("/:cid", async (req, res) => {
  const { cid } = req.params;
  try {
    const cart = await Cart.findById(cid).populate("products.product");
    if (!cart) return res.status(404).json({ error: "Carrito no encontrado" });

    res.json(cart);
  } catch (error) {
    console.error("Error al cargar el carrito:", error);
    res.status(500).json({ error: "Error al cargar el carrito" });
  }
});

router.post("/", async (req, res) => {
  try {
    const newCart = new Cart({ products: [] });
    await newCart.save();
    res.status(201).json({ cartId: newCart._id });
  } catch (error) {
    console.error("Error al crear el carrito:", error);
    res.status(500).json({ error: "Error al crear el carrito" });
  }
});

router.post("/:cid/products/:pid", async (req, res) => {
  const { cid, pid } = req.params;

  try {
    const cart = await Cart.findById(cid);
    if (!cart) {
      return res.status(404).json({ error: "Carrito no encontrado" });
    }

    const product = await Product.findById(pid);
    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const productInCart = cart.products.find(
      (item) => item.product.toString() === pid
    );
    const requestedQuantity = productInCart ? productInCart.quantity + 1 : 1;

    if (requestedQuantity > product.stock) {
      return res.status(400).json({ error: "Stock insuficiente" });
    }

    if (productInCart) {
      productInCart.quantity += 1;
    } else {
      cart.products.push({ product: pid, quantity: 1 });
    }

    await cart.save();

    req.io.emit("quantityUpdated", {
      cartId: cid,
      productId: pid,
      quantity: requestedQuantity,
    });
    res.status(200).json({ message: "Producto agregado al carrito" });
  } catch (error) {
    console.error("Error al agregar producto al carrito:", error);
    res.status(500).json({ error: "Error al agregar producto al carrito" });
  }
});

router.delete("/:cid/products/:pid", async (req, res) => {
  const { cid, pid } = req.params;

  try {
    const cart = await Cart.findById(cid);
    if (!cart) {
      return res.status(404).json({ error: "Carrito no encontrado" });
    }

    cart.products = cart.products.filter(
      (item) => item.product.toString() !== pid
    );
    await cart.save();

    req.io.emit("productRemoved", { cartId: cid, productId: pid });
    res.status(200).json({ message: "Producto eliminado del carrito" });
  } catch (error) {
    console.error("Error al eliminar producto del carrito:", error);
    res.status(500).json({ error: "Error al eliminar producto del carrito" });
  }
});

router.put("/:cid", async (req, res) => {
  const { cid } = req.params;
  const { products } = req.body;

  try {
    const cart = await Cart.findById(cid);
    if (!cart) return res.status(404).json({ error: "Carrito no encontrado" });

    cart.products = products;
    await cart.save();

    res
      .status(200)
      .json({ message: "Carrito actualizado correctamente", cart });
  } catch (error) {
    console.error("Error al actualizar carrito:", error);
    res.status(500).json({ error: "Error al actualizar carrito" });
  }
});

router.put("/:cid/products/:pid", async (req, res) => {
  const { cid, pid } = req.params;
  const { quantity } = req.body;

  try {
    if (quantity < 1) {
      return res.status(400).json({ error: "La cantidad debe ser al menos 1" });
    }

    const cart = await Cart.findById(cid);
    if (!cart) {
      return res.status(404).json({ error: "Carrito no encontrado" });
    }

    const productInCart = cart.products.find(
      (item) => item.product.toString() === pid
    );
    if (!productInCart) {
      return res
        .status(404)
        .json({ error: "Producto no encontrado en el carrito" });
    }

    productInCart.quantity = quantity;
    await cart.save();

    res.status(200).json({ message: "Cantidad actualizada en el carrito" });
  } catch (error) {
    console.error("Error al actualizar cantidad en el carrito:", error);
    res
      .status(500)
      .json({ error: "Error al actualizar cantidad en el carrito" });
  }
});

router.delete("/:cid", async (req, res) => {
  const { cid } = req.params;

  try {
    const cart = await Cart.findById(cid);
    if (!cart) {
      return res.status(404).json({ error: "Carrito no encontrado" });
    }

    cart.products = [];
    await cart.save();

    req.io.emit("cartCleared", { cartId: cid });
    res.status(200).json({ message: "Carrito vaciado" });
  } catch (error) {
    console.error("Error al vaciar el carrito:", error);
    res.status(500).json({ error: "Error al vaciar el carrito" });
  }
});

export default router;
