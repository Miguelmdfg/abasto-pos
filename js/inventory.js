<<<<<<< HEAD
const API_URL = "http://localhost:3000";

// ELEMENTOS
const inventoryBody = document.getElementById("inventoryBody");
const searchInput = document.getElementById("searchInput");
const addProductBtn = document.getElementById("addProductBtn");

// MODAL PRODUCTO
const productOverlay = document.getElementById("productOverlay");
const productModal = document.getElementById("productModal");
const modalTitle = document.getElementById("modalTitle");
const pName = document.getElementById("pName");
const pCategory = document.getElementById("pCategory");
const pPrice = document.getElementById("pPrice");
const pStock = document.getElementById("pStock");
const saveProduct = document.getElementById("saveProduct");
const cancelProduct = document.getElementById("cancelProduct");

// MODAL STOCK
const stockOverlay = document.getElementById("stockOverlay");
const stockModal = document.getElementById("stockModal");
const stockProductName = document.getElementById("stockProductName");
const stockAmount = document.getElementById("stockAmount");
const saveStock = document.getElementById("saveStock");
const cancelStock = document.getElementById("cancelStock");

let editingProduct = null;
let products = [];

// ===============================
// 1. CARGAR PRODUCTOS DESDE API
// ===============================
async function loadProducts() {
  try {
    const res = await fetch(`${API_URL}/products`);
    products = await res.json();
    renderInventory();
  } catch (err) {
    console.error("Error cargando productos:", err);
    alert("Error conectando con el servidor.");
  }
}

// ===============================
// 2. RENDERIZAR TABLA
// ===============================
function renderInventory(filter = "") {
  inventoryBody.innerHTML = "";
  const term = filter.toLowerCase();

  products
    .filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term)
    )
    .forEach(p => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td>${p.price.toFixed(2)} Bs</td>
        <td>${p.stock}</td>
        <td>
          <button class="action-btn" data-edit="${p.id}">Editar</button>
          <button class="action-btn" data-stock="${p.id}">Stock</button>
        </td>
      `;

      inventoryBody.appendChild(row);
    });

  document.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => openEditModal(parseInt(btn.dataset.edit)));
  });

  document.querySelectorAll("[data-stock]").forEach(btn => {
    btn.addEventListener("click", () => openStockModal(parseInt(btn.dataset.stock)));
  });
}

// ===============================
// 3. BUSCADOR
// ===============================
searchInput.addEventListener("input", e => {
  renderInventory(e.target.value);
});

// ===============================
// 4. MODAL PRODUCTO
// ===============================
function openProductModal() {
  editingProduct = null;
  modalTitle.textContent = "Nuevo producto";
  pName.value = "";
  pCategory.value = "";
  pPrice.value = "";
  pStock.value = "";
  productOverlay.classList.add("visible");
  productModal.classList.add("open");
}

function openEditModal(id) {
  editingProduct = products.find(p => p.id === id);
  modalTitle.textContent = "Editar producto";
  pName.value = editingProduct.name;
  pCategory.value = editingProduct.category;
  pPrice.value = editingProduct.price;
  pStock.value = editingProduct.stock;
  productOverlay.classList.add("visible");
  productModal.classList.add("open");
}

function closeProductModal() {
  productOverlay.classList.remove("visible");
  productModal.classList.remove("open");
}

addProductBtn.addEventListener("click", openProductModal);
cancelProduct.addEventListener("click", closeProductModal);
productOverlay.addEventListener("click", closeProductModal);

// ===============================
// 5. GUARDAR PRODUCTO (POST / PUT)
// ===============================
saveProduct.addEventListener("click", async () => {
  const data = {
    name: pName.value,
    category: pCategory.value,
    price: parseFloat(pPrice.value),
    stock: parseInt(pStock.value),
  };

  if (!data.name || !data.category || isNaN(data.price) || isNaN(data.stock)) {
    alert("Por favor completa todos los campos correctamente.");
    return;
  }

  try {
    if (editingProduct) {
      // EDITAR PRODUCTO
      await fetch(`${API_URL}/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    } else {
      // CREAR PRODUCTO
      await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    }

    closeProductModal();
    await loadProducts();

  } catch (err) {
    console.error("Error guardando producto:", err);
    alert("Error conectando con el servidor.");
  }
});

// ===============================
// 6. MODAL STOCK
// ===============================
function openStockModal(id) {
  editingProduct = products.find(p => p.id === id);
  stockProductName.textContent = editingProduct.name;
  stockAmount.value = "";
  stockOverlay.classList.add("visible");
  stockModal.classList.add("open");
}

function closeStockModal() {
  stockOverlay.classList.remove("visible");
  stockModal.classList.remove("open");
}

cancelStock.addEventListener("click", closeStockModal);
stockOverlay.addEventListener("click", closeStockModal);

// ===============================
// 7. AJUSTAR STOCK (PATCH)
// ===============================
saveStock.addEventListener("click", async () => {
  const amount = parseInt(stockAmount.value);

  if (isNaN(amount)) {
    alert("Ingresa una cantidad válida.");
    return;
  }

  try {
    await fetch(`${API_URL}/products/stock/${editingProduct.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount })
    });

    closeStockModal();
    await loadProducts();

  } catch (err) {
    console.error("Error ajustando stock:", err);
    alert("Error conectando con el servidor.");
  }
});

// ===============================
// 8. INICIAR
// ===============================
loadProducts();
=======
const API_URL = "http://localhost:3000";

// ELEMENTOS
const inventoryBody = document.getElementById("inventoryBody");
const searchInput = document.getElementById("searchInput");
const addProductBtn = document.getElementById("addProductBtn");

// MODAL PRODUCTO
const productOverlay = document.getElementById("productOverlay");
const productModal = document.getElementById("productModal");
const modalTitle = document.getElementById("modalTitle");
const pName = document.getElementById("pName");
const pCategory = document.getElementById("pCategory");
const pPrice = document.getElementById("pPrice");
const pStock = document.getElementById("pStock");
const saveProduct = document.getElementById("saveProduct");
const cancelProduct = document.getElementById("cancelProduct");

// MODAL STOCK
const stockOverlay = document.getElementById("stockOverlay");
const stockModal = document.getElementById("stockModal");
const stockProductName = document.getElementById("stockProductName");
const stockAmount = document.getElementById("stockAmount");
const saveStock = document.getElementById("saveStock");
const cancelStock = document.getElementById("cancelStock");

let editingProduct = null;
let products = [];

// ===============================
// 1. CARGAR PRODUCTOS DESDE API
// ===============================
async function loadProducts() {
  try {
    const res = await fetch(`${API_URL}/products`);
    products = await res.json();
    renderInventory();
  } catch (err) {
    console.error("Error cargando productos:", err);
    alert("Error conectando con el servidor.");
  }
}

// ===============================
// 2. RENDERIZAR TABLA
// ===============================
function renderInventory(filter = "") {
  inventoryBody.innerHTML = "";
  const term = filter.toLowerCase();

  products
    .filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term)
    )
    .forEach(p => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td>${p.price.toFixed(2)} Bs</td>
        <td>${p.stock}</td>
        <td>
          <button class="action-btn" data-edit="${p.id}">Editar</button>
          <button class="action-btn" data-stock="${p.id}">Stock</button>
        </td>
      `;

      inventoryBody.appendChild(row);
    });

  document.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => openEditModal(parseInt(btn.dataset.edit)));
  });

  document.querySelectorAll("[data-stock]").forEach(btn => {
    btn.addEventListener("click", () => openStockModal(parseInt(btn.dataset.stock)));
  });
}

// ===============================
// 3. BUSCADOR
// ===============================
searchInput.addEventListener("input", e => {
  renderInventory(e.target.value);
});

// ===============================
// 4. MODAL PRODUCTO
// ===============================
function openProductModal() {
  editingProduct = null;
  modalTitle.textContent = "Nuevo producto";
  pName.value = "";
  pCategory.value = "";
  pPrice.value = "";
  pStock.value = "";
  productOverlay.classList.add("visible");
  productModal.classList.add("open");
}

function openEditModal(id) {
  editingProduct = products.find(p => p.id === id);
  modalTitle.textContent = "Editar producto";
  pName.value = editingProduct.name;
  pCategory.value = editingProduct.category;
  pPrice.value = editingProduct.price;
  pStock.value = editingProduct.stock;
  productOverlay.classList.add("visible");
  productModal.classList.add("open");
}

function closeProductModal() {
  productOverlay.classList.remove("visible");
  productModal.classList.remove("open");
}

addProductBtn.addEventListener("click", openProductModal);
cancelProduct.addEventListener("click", closeProductModal);
productOverlay.addEventListener("click", closeProductModal);

// ===============================
// 5. GUARDAR PRODUCTO (POST / PUT)
// ===============================
saveProduct.addEventListener("click", async () => {
  const data = {
    name: pName.value,
    category: pCategory.value,
    price: parseFloat(pPrice.value),
    stock: parseInt(pStock.value),
  };

  if (!data.name || !data.category || isNaN(data.price) || isNaN(data.stock)) {
    alert("Por favor completa todos los campos correctamente.");
    return;
  }

  try {
    if (editingProduct) {
      // EDITAR PRODUCTO
      await fetch(`${API_URL}/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    } else {
      // CREAR PRODUCTO
      await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    }

    closeProductModal();
    await loadProducts();

  } catch (err) {
    console.error("Error guardando producto:", err);
    alert("Error conectando con el servidor.");
  }
});

// ===============================
// 6. MODAL STOCK
// ===============================
function openStockModal(id) {
  editingProduct = products.find(p => p.id === id);
  stockProductName.textContent = editingProduct.name;
  stockAmount.value = "";
  stockOverlay.classList.add("visible");
  stockModal.classList.add("open");
}

function closeStockModal() {
  stockOverlay.classList.remove("visible");
  stockModal.classList.remove("open");
}

cancelStock.addEventListener("click", closeStockModal);
stockOverlay.addEventListener("click", closeStockModal);

// ===============================
// 7. AJUSTAR STOCK (PATCH)
// ===============================
saveStock.addEventListener("click", async () => {
  const amount = parseInt(stockAmount.value);

  if (isNaN(amount)) {
    alert("Ingresa una cantidad válida.");
    return;
  }

  try {
    await fetch(`${API_URL}/products/stock/${editingProduct.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount })
    });

    closeStockModal();
    await loadProducts();

  } catch (err) {
    console.error("Error ajustando stock:", err);
    alert("Error conectando con el servidor.");
  }
});

// ===============================
// 8. INICIAR
// ===============================
loadProducts();
>>>>>>> NewMiguel
