<<<<<<< HEAD
const API_URL = "http://localhost:3000";

let products = [];
let cart = [];

// ELEMENTOS
const posProducts = document.getElementById("posProducts");
const posSearch = document.getElementById("posSearch");
const ticketItems = document.getElementById("ticketItems");
const ticketTotal = document.getElementById("ticketTotal");
const ticketTag = document.getElementById("ticketTag");
const ticketCheckout = document.getElementById("ticketCheckout");

const payButtons = document.querySelectorAll(".pay-btn");
let selectedMethod = null;

// MODAL PAGO MÓVIL
const pmOverlay = document.getElementById("pmOverlay");
const pmModal = document.getElementById("pmModal");
const pmBanco = document.getElementById("pmBanco");
const pmReferencia = document.getElementById("pmReferencia");
const pmMonto = document.getElementById("pmMonto");
const pmCancel = document.getElementById("pmCancel");
const pmConfirm = document.getElementById("pmConfirm");

// MODAL ERROR
const errorOverlay = document.getElementById('errorOverlay');
const errorModal = document.getElementById('errorModal');
const errorMessage = document.getElementById('errorMessage');
const errorClose = document.getElementById('errorClose');

function showErrorModal(msg) {
  errorMessage.textContent = msg || 'Ocurrió un error';
  errorOverlay.classList.add('visible');
  errorModal.classList.add('open');
}

function closeErrorModal() {
  errorOverlay.classList.remove('visible');
  errorModal.classList.remove('open');
}

errorClose.addEventListener('click', closeErrorModal);
errorOverlay.addEventListener('click', closeErrorModal);

// ===============================
// 1. CARGAR PRODUCTOS REALES
// ===============================
async function loadProducts() {
  try {
    const res = await fetch(`${API_URL}/products`);
    products = await res.json();
    renderProducts();
  } catch (err) {
    console.error("Error cargando productos:", err);
    alert("Error conectando con el servidor.");
  }
}

// ===============================
// 2. RENDERIZAR PRODUCTOS
// ===============================
function renderProducts(filter = "") {
  posProducts.innerHTML = "";
  const term = filter.toLowerCase();

  products
    .filter(p => p.name.toLowerCase().includes(term))
    .forEach(p => {
      const requiredQty = cart.reduce((s, c) => (c.id === p.id ? s + c.qty : s), 0);
      const deficit = requiredQty > p.stock ? requiredQty - p.stock : 0;
      const row = document.createElement("div");
      row.classList.add("product-row");

      const badgeHTML = deficit > 0 ? `<span class="stock-badge">Falta ${deficit}</span>` : '';

      row.innerHTML = `
        <div>
          <div class="product-name">${p.name} ${badgeHTML}</div>
          <div class="product-meta">${p.id}</div>
        </div>
        <div class="product-price">${p.price} Bs</div>
        <button class="product-add" data-id="${p.id}">Agregar</button>
      `;

      if (deficit > 0) row.classList.add('low-stock');

      posProducts.appendChild(row);
    });

  document.querySelectorAll(".product-add").forEach(btn => {
    btn.addEventListener("click", () => addToCart(parseInt(btn.dataset.id)));
  });
}

posSearch.addEventListener("input", e => {
  renderProducts(e.target.value);
});

// ===============================
// 3. AGREGAR AL CARRITO
// ===============================
function addToCart(id) {
  const product = products.find(p => p.id === id);
  const existing = cart.find(c => c.id === id);

  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  renderCart();
  renderProducts(posSearch.value || '');
}

// ===============================
// 4. RENDERIZAR CARRITO
// ===============================
function renderCart() {
  ticketItems.innerHTML = "";
  let total = 0;

  cart.forEach(item => {
    total += item.price * item.qty;

    const row = document.createElement("div");
    row.classList.add("ticket-row-item");

    row.innerHTML = `
      <div>${item.name}</div>
      <div>x${item.qty}</div>
      <div>${item.price * item.qty} Bs</div>
    `;

    ticketItems.appendChild(row);
  });

  ticketTotal.textContent = total.toFixed(2) + " Bs";
}

// ===============================
// 5. SELECCIÓN DE MÉTODO DE PAGO
// ===============================
payButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    payButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedMethod = btn.dataset.method;
    ticketTag.textContent = btn.textContent;
  });
});

// ===============================
// 6. REGISTRAR VENTA
// ===============================
ticketCheckout.addEventListener("click", () => {
  if (cart.length === 0) {
    alert("No hay productos en la venta.");
    return;
  }

  if (!selectedMethod) {
    alert("Selecciona un método de pago.");
    return;
  }

  if (selectedMethod === "pago_movil") {
    openPmModal();
    return;
  }

  completeSale();
});

// ===============================
// 7. MODAL PAGO MÓVIL
// ===============================
function openPmModal() {
  pmBanco.value = "";
  pmReferencia.value = "";
  pmMonto.value = "";
  pmOverlay.classList.add("visible");
  pmModal.classList.add("open");
}

function closePmModal() {
  pmOverlay.classList.remove("visible");
  pmModal.classList.remove("open");
}

pmCancel.addEventListener("click", closePmModal);
pmOverlay.addEventListener("click", closePmModal);

pmConfirm.addEventListener("click", async () => {
  if (!pmBanco.value || !pmReferencia.value || !pmMonto.value) {
    alert("Completa todos los datos del pago móvil.");
    return;
  }

  const pagoData = {
    banco: pmBanco.value,
    referencia: pmReferencia.value,
    monto: parseFloat(pmMonto.value),
    cliente: "N/A"
  };

  // First register the pago móvil so it appears immediately in the payments section,
  // then create the sale and link the payment to the sale by passing the payment id.
  try {
    const resp = await fetch(`${API_URL}/pagomovil`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pagoData)
    });
    const created = await resp.json();
    closePmModal();
    completeSale({ pagomovilId: created.id });
    return;
  } catch (err) {
    console.error('Error registrando pago móvil:', err);
    alert('No se pudo registrar el pago móvil. Intenta de nuevo.');
    return;
  }
});

// ===============================
// 8. COMPLETAR VENTA (DESCUENTO DE STOCK)
// ===============================
async function completeSale(extra = {}) {
  try {
    // Disable checkout to prevent duplicate submissions
    ticketCheckout.disabled = true;

    // Registrar venta enviando array de items {id, qty} para que el backend
    // valide y descuente stock automáticamente.
    const body = {
      productos: cart.map(c => ({ id: c.id, qty: c.qty })),
      metodo: selectedMethod,
      total: parseFloat(ticketTotal.textContent)
    };
    if (extra.pagomovil) body.pagomovil = extra.pagomovil;

    const res = await fetch(`${API_URL}/sales`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      // Show backend error message (e.g. stock insuficiente)
      let err = { error: 'Error registrando la venta.' };
      try { err = await res.json(); } catch (e) {}
      showErrorModal(err.error || 'Error registrando la venta.');
      return;
    }

    alert("Venta registrada con éxito.");

    cart = [];
    selectedMethod = null;
    payButtons.forEach(b => b.classList.remove("active"));
    ticketTag.textContent = "Sin pago";
    renderCart();
    loadProducts();

  } catch (err) {
    console.error("Error completando venta:", err);
    alert("Error registrando la venta.");
  }
  finally {
    ticketCheckout.disabled = false;
  }
}

// ===============================
// 9. INICIAR
// ===============================
loadProducts();
=======
const API_URL = "http://localhost:3000";

let products = [];
let cart = [];

// ELEMENTOS
const posProducts = document.getElementById("posProducts");
const posSearch = document.getElementById("posSearch");
const ticketItems = document.getElementById("ticketItems");
const ticketTotal = document.getElementById("ticketTotal");
const ticketTag = document.getElementById("ticketTag");
const ticketCheckout = document.getElementById("ticketCheckout");

const payButtons = document.querySelectorAll(".pay-btn");
let selectedMethod = null;

// MODAL PAGO MÓVIL
const pmOverlay = document.getElementById("pmOverlay");
const pmModal = document.getElementById("pmModal");
const pmBanco = document.getElementById("pmBanco");
const pmReferencia = document.getElementById("pmReferencia");
const pmMonto = document.getElementById("pmMonto");
const pmCancel = document.getElementById("pmCancel");
const pmConfirm = document.getElementById("pmConfirm");

// MODAL ERROR
const errorOverlay = document.getElementById('errorOverlay');
const errorModal = document.getElementById('errorModal');
const errorMessage = document.getElementById('errorMessage');
const errorClose = document.getElementById('errorClose');

function showErrorModal(msg) {
  errorMessage.textContent = msg || 'Ocurrió un error';
  errorOverlay.classList.add('visible');
  errorModal.classList.add('open');
}

function closeErrorModal() {
  errorOverlay.classList.remove('visible');
  errorModal.classList.remove('open');
}

errorClose.addEventListener('click', closeErrorModal);
errorOverlay.addEventListener('click', closeErrorModal);

// ===============================
// 1. CARGAR PRODUCTOS REALES
// ===============================
async function loadProducts() {
  try {
    const res = await fetch(`${API_URL}/products`);
    products = await res.json();
    renderProducts();
  } catch (err) {
    console.error("Error cargando productos:", err);
    alert("Error conectando con el servidor.");
  }
}

// ===============================
// 2. RENDERIZAR PRODUCTOS
// ===============================
function renderProducts(filter = "") {
  posProducts.innerHTML = "";
  const term = filter.toLowerCase();

  products
    .filter(p => p.name.toLowerCase().includes(term))
    .forEach(p => {
      const requiredQty = cart.reduce((s, c) => (c.id === p.id ? s + c.qty : s), 0);
      const deficit = requiredQty > p.stock ? requiredQty - p.stock : 0;
      const row = document.createElement("div");
      row.classList.add("product-row");

      const badgeHTML = deficit > 0 ? `<span class="stock-badge">Falta ${deficit}</span>` : '';

      row.innerHTML = `
        <div>
          <div class="product-name">${p.name} ${badgeHTML}</div>
          <div class="product-meta">${p.id}</div>
        </div>
        <div class="product-price">${p.price} Bs</div>
        <button class="product-add" data-id="${p.id}">Agregar</button>
      `;

      if (deficit > 0) row.classList.add('low-stock');

      posProducts.appendChild(row);
    });

  document.querySelectorAll(".product-add").forEach(btn => {
    btn.addEventListener("click", () => addToCart(parseInt(btn.dataset.id)));
  });
}

posSearch.addEventListener("input", e => {
  renderProducts(e.target.value);
});

// ===============================
// 3. AGREGAR AL CARRITO
// ===============================
function addToCart(id) {
  const product = products.find(p => p.id === id);
  const existing = cart.find(c => c.id === id);

  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  renderCart();
  renderProducts(posSearch.value || '');
}

// ===============================
// 4. RENDERIZAR CARRITO
// ===============================
function renderCart() {
  ticketItems.innerHTML = "";
  let total = 0;

  cart.forEach(item => {
    total += item.price * item.qty;

    const row = document.createElement("div");
    row.classList.add("ticket-row-item");

    row.innerHTML = `
      <div>${item.name}</div>
      <div>x${item.qty}</div>
      <div>${item.price * item.qty} Bs</div>
    `;

    ticketItems.appendChild(row);
  });

  ticketTotal.textContent = total.toFixed(2) + " Bs";
}

// ===============================
// 5. SELECCIÓN DE MÉTODO DE PAGO
// ===============================
payButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    payButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedMethod = btn.dataset.method;
    ticketTag.textContent = btn.textContent;
  });
});

// ===============================
// 6. REGISTRAR VENTA
// ===============================
ticketCheckout.addEventListener("click", () => {
  if (cart.length === 0) {
    alert("No hay productos en la venta.");
    return;
  }

  if (!selectedMethod) {
    alert("Selecciona un método de pago.");
    return;
  }

  if (selectedMethod === "pago_movil") {
    openPmModal();
    return;
  }

  completeSale();
});

// ===============================
// 7. MODAL PAGO MÓVIL
// ===============================
function openPmModal() {
  pmBanco.value = "";
  pmReferencia.value = "";
  pmMonto.value = "";
  pmOverlay.classList.add("visible");
  pmModal.classList.add("open");
}

function closePmModal() {
  pmOverlay.classList.remove("visible");
  pmModal.classList.remove("open");
}

pmCancel.addEventListener("click", closePmModal);
pmOverlay.addEventListener("click", closePmModal);

pmConfirm.addEventListener("click", async () => {
  if (!pmBanco.value || !pmReferencia.value || !pmMonto.value) {
    alert("Completa todos los datos del pago móvil.");
    return;
  }

  const pagoData = {
    banco: pmBanco.value,
    referencia: pmReferencia.value,
    monto: parseFloat(pmMonto.value),
    cliente: "N/A"
  };

  // First register the pago móvil so it appears immediately in the payments section,
  // then create the sale and link the payment to the sale by passing the payment id.
  try {
    const resp = await fetch(`${API_URL}/pagomovil`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pagoData)
    });
    const created = await resp.json();
    closePmModal();
    completeSale({ pagomovilId: created.id });
    return;
  } catch (err) {
    console.error('Error registrando pago móvil:', err);
    alert('No se pudo registrar el pago móvil. Intenta de nuevo.');
    return;
  }
});

// ===============================
// 8. COMPLETAR VENTA (DESCUENTO DE STOCK)
// ===============================
async function completeSale(extra = {}) {
  try {
    // Disable checkout to prevent duplicate submissions
    ticketCheckout.disabled = true;

    // Registrar venta enviando array de items {id, qty} para que el backend
    // valide y descuente stock automáticamente.
    const body = {
      productos: cart.map(c => ({ id: c.id, qty: c.qty })),
      metodo: selectedMethod,
      total: parseFloat(ticketTotal.textContent)
    };
    if (extra.pagomovil) body.pagomovil = extra.pagomovil;

    const res = await fetch(`${API_URL}/sales`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      // Show backend error message (e.g. stock insuficiente)
      let err = { error: 'Error registrando la venta.' };
      try { err = await res.json(); } catch (e) {}
      showErrorModal(err.error || 'Error registrando la venta.');
      return;
    }

    alert("Venta registrada con éxito.");

    cart = [];
    selectedMethod = null;
    payButtons.forEach(b => b.classList.remove("active"));
    ticketTag.textContent = "Sin pago";
    renderCart();
    loadProducts();

  } catch (err) {
    console.error("Error completando venta:", err);
    alert("Error registrando la venta.");
  }
  finally {
    ticketCheckout.disabled = false;
  }
}

// ===============================
// 9. INICIAR
// ===============================
loadProducts();
>>>>>>> NewMiguel
