const socket = io();

socket.on("productRemoved", (data) => {
  const { productId } = data;
  const productElement = document.querySelector(
    `[data-product-id="${productId}"]`
  );
  if (productElement) {
    productElement.remove();
  }
});

socket.on("quantityUpdated", (data) => {
  const { productId, quantity } = data;
  const quantityElement = document.getElementById(`quantity-${productId}`);
  if (quantityElement) {
    quantityElement.innerText = quantity;
  }
});

socket.on("cartCleared", () => {
  const cartList = document.getElementById("cart-list");
  if (cartList) {
    cartList.innerHTML = "";
  }
});

async function loadCart() {
  const cartId = localStorage.getItem("cartId");

  try {
    const response = await fetch(`/api/carts/${cartId}`);
    const cart = await response.json();

    if (response.ok) {
      renderCart(cart);
    } else {
      console.error("Error al cargar carrito:", cart.error);
      Swal.fire("Error", "No se pudo cargar el carrito", "error");
    }
  } catch (error) {
    console.error("Error al cargar carrito:", error);
  }
}

function renderCart(cart) {
  const cartList = document.getElementById("cart-list");
  cartList.innerHTML = "";

  cart.products.forEach((item) => {
    const li = document.createElement("li");
    li.setAttribute("data-product-id", item.product._id);
    li.innerHTML = `
      <img src="${item.product.imageUrl}" alt="${item.product.title}" class="product-image" />
      <h3>${item.product.title}</h3>
      <p>Precio: $${item.product.price}</p>
      <p>Cantidad: <span id="quantity-${item.product._id}">${item.quantity}</span></p>
      <button onclick="removeFromCart('${item.product._id}')">Eliminar</button>
      <button onclick="updateQuantity('${item.product._id}', ${item.quantity}, 1)">+</button>
      <button onclick="updateQuantity('${item.product._id}', ${item.quantity}, -1)">-</button>
    `;
    cartList.appendChild(li);
  });
}
async function removeFromCart(productId) {
  const cartId = localStorage.getItem("cartId");

  try {
    const response = await fetch(`/api/carts/${cartId}/products/${productId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      Swal.fire(
        "Producto eliminado",
        "Producto eliminado del carrito",
        "success"
      );
    } else {
      Swal.fire("Error", "No se pudo eliminar el producto", "error");
    }
  } catch (error) {
    console.error("Error al eliminar producto del carrito:", error);
    Swal.fire("Error", "No se pudo eliminar el producto del carrito", "error");
  }
}

async function clearCart() {
  const cartId = localStorage.getItem("cartId");

  if (!cartId) {
    Swal.fire("Error", "No se pudo encontrar el carrito.", "error");
    return;
  }

  try {
    const response = await fetch(`/api/carts/${cartId}`, {
      method: "DELETE",
      headers: {
        "Cache-Control": "no-cache",
      },
    });

    if (response.ok) {
      Swal.fire("Carrito vacío", "Carrito vaciado con éxito", "success");
    } else {
      Swal.fire("Error", "No se pudo vaciar el carrito", "error");
    }
  } catch (error) {
    console.error("Error al vaciar el carrito:", error);
    Swal.fire("Error", "No se pudo vaciar el carrito", "error");
  }
}

async function updateQuantity(productId, currentQuantity, change) {
  const newQuantity = currentQuantity + change;
  if (newQuantity < 1) {
    Swal.fire("Error", "La cantidad no puede ser menor a 1.", "error");
    return;
  }

  const cartId = localStorage.getItem("cartId");
  if (!cartId) {
    Swal.fire("Error", "No se pudo encontrar el carrito.", "error");
    return;
  }

  try {
    const response = await fetch(`/api/carts/${cartId}/products/${productId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quantity: newQuantity }),
    });

    if (response.ok) {
      Swal.fire(
        "Cantidad actualizada",
        "Cantidad actualizada en el carrito",
        "success"
      );
    } else {
      Swal.fire("Error", "No se pudo actualizar la cantidad", "error");
    }
  } catch (error) {
    console.error("Error al actualizar la cantidad del producto:", error);
    Swal.fire("Error", "No se pudo actualizar la cantidad", "error");
  }
}
