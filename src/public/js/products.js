let currentCategory = null;
let currentSort = "asc";
let currentPage = 1;

async function loadPage(
  page = currentPage,
  category = currentCategory,
  sort = currentSort
) {
  const url = new URL("/api/products", window.location.origin);
  url.searchParams.append("page", page);
  url.searchParams.append("limit", 5);

  if (category) url.searchParams.append("category", category);
  url.searchParams.append("sort", sort);

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Error al cargar productos");

    const data = await response.json();
    if (data.payload) {
      renderProducts(data.payload);
      renderPagination(data);
    } else {
      throw new Error("Formato de respuesta inválido");
    }
  } catch (error) {
    console.error("Error al cargar productos:", error);
    Swal.fire("Error", "No se pudo cargar los productos", "error");
  }
}

function renderProducts(products) {
  const productList = document.getElementById("product-list");
  if (!productList) {
    console.warn("Elemento 'product-list' no encontrado.");
    return;
  }

  productList.innerHTML = "";

  products.forEach((product) => {
    const productItem = document.createElement("li");
    productItem.innerHTML = `
      <img src="${product.imageUrl}" alt="${product.title}" class="product-image" style="width: 100%; height: auto; border-radius: 5px; margin-bottom: 10px;" />
      <h3>${product.title}</h3>
      <p>Precio: $${product.price}</p>
      <button onclick="addToCart('${product._id}')">Agregar al carrito</button>
      <a href="/products/${product._id}">Ver Más</a>
    `;
    productList.appendChild(productItem);
  });
}

function renderPagination(pagination) {
  const paginationControls = document.getElementById("pagination-controls");
  if (!paginationControls) {
    console.warn("Elemento 'pagination-controls' no encontrado.");
    return;
  }

  paginationControls.innerHTML = "";

  if (pagination.hasPrevPage) {
    const prevButton = document.createElement("button");
    prevButton.innerText = "←"; // Flecha para "Página Anterior"
    prevButton.onclick = () => {
      currentPage = pagination.prevPage;
      loadPage(currentPage, currentCategory, currentSort);
    };
    paginationControls.appendChild(prevButton);
  }

  const pageInfo = document.createElement("span");
  pageInfo.innerText = `Página ${pagination.page} de ${pagination.totalPages}`;
  paginationControls.appendChild(pageInfo);

  if (pagination.hasNextPage) {
    const nextButton = document.createElement("button");
    nextButton.innerText = "→"; // Flecha para "Página Siguiente"
    nextButton.onclick = () => {
      currentPage = pagination.nextPage;
      loadPage(currentPage, currentCategory, currentSort);
    };
    paginationControls.appendChild(nextButton);
  }
}
window.onload = () => {
  const categoryFilter = document.getElementById("category-filter");
  if (categoryFilter) {
    categoryFilter.addEventListener("change", (event) => {
      currentCategory = event.target.value;
      loadPage(1, currentCategory, currentSort);
    });
  }

  const sortFilter = document.getElementById("sort-filter");
  if (sortFilter) {
    sortFilter.addEventListener("change", (event) => {
      currentSort = event.target.value;
      loadPage(1, currentCategory, currentSort);
    });
  }

  // Cargar la primera página al iniciar
  loadPage(1);
};
function viewCart() {
  const cartId = localStorage.getItem("cartId");
  if (cartId) {
    window.location.href = `/cart/${cartId}`;
  } else {
    Swal.fire("Error", "No se encontró un carrito activo", "error");
  }
}

async function createCart() {
  try {
    const response = await fetch("/api/carts", { method: "POST" });
    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("cartId", data.cartId);
      return data.cartId;
    } else {
      console.error("Error al crear el carrito:", data.error);
      Swal.fire("Error", data.error, "error");
    }
  } catch (error) {
    console.error("Error al crear el carrito:", error);
    Swal.fire("Error", "No se pudo crear el carrito", "error");
  }
}

async function addToCart(productId) {
  let cartId = localStorage.getItem("cartId");

  if (!cartId) {
    cartId = await createCart();
  }

  if (!cartId) {
    console.error("No se pudo obtener el cartId");
    return;
  }

  try {
    const response = await fetch(`/api/carts/${cartId}/products/${productId}`, {
      method: "POST",
    });
    const data = await response.json();

    if (response.ok) {
      Swal.fire("Producto agregado", data.message, "success");
    } else {
      Swal.fire("Error", data.error, "error");
    }
  } catch (error) {
    console.error("Error al agregar producto al carrito:", error);
    Swal.fire("Error", "No se pudo agregar el producto al carrito", "error");
  }
}
