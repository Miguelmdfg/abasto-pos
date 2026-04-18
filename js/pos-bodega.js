const API_URL = "http://localhost:3000";

let products = [];
let cart = [];
let sesionActiva = null;

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

// MODAL APERTURA
const aperturaOverlay = document.getElementById('aperturaOverlay');
const aperturaModal = document.getElementById('aperturaModal');
const aperturaCajero = document.getElementById('aperturaCajero');
const aperturaFondoBs = document.getElementById('aperturaFondoBs');
const aperturaFondoUsd = document.getElementById('aperturaFondoUsd');
const aperturaCancelar = document.getElementById('aperturaCancelar');
const aperturaConfirmar = document.getElementById('aperturaConfirmar');

// MODAL CIERRE
const cierreOverlay = document.getElementById('cierreOverlay');
const cierreModal = document.getElementById('cierreModal');
const cierreCancelar = document.getElementById('cierreCancelar');
const cierreConfirmar = document.getElementById('cierreConfirmar');
const btnCerrarCaja = document.getElementById('btnCerrarCaja');
const cajeroInfo = document.getElementById('cajeroInfo');

// Elementos del modal de cierre
const cierreFondoBs = document.getElementById('cierreFondoBs');
const cierreFondoUsd = document.getElementById('cierreFondoUsd');
const cierreTeoricoBs = document.getElementById('cierreTeoricoBs');
const cierreTeoricoUsd = document.getElementById('cierreTeoricoUsd');
const cierreEfectivoBs = document.getElementById('cierreEfectivoBs');
const cierreEfectivoUsd = document.getElementById('cierreEfectivoUsd');
const cierrePagoMovil = document.getElementById('cierrePagoMovil');
const cierrePuntoVenta = document.getElementById('cierrePuntoVenta');
const cierreFiado = document.getElementById('cierreFiado');
const cierreConteoBs = document.getElementById('cierreConteoBs');
const cierreConteoUsd = document.getElementById('cierreConteoUsd');
const cierreDiferenciaBs = document.getElementById('cierreDiferenciaBs');
const cierreDiferenciaUsd = document.getElementById('cierreDiferenciaUsd');
const boxDiferenciaBs = document.getElementById('boxDiferenciaBs');
const boxDiferenciaUsd = document.getElementById('boxDiferenciaUsd');
const cierreTotalVentas = document.getElementById('cierreTotalVentas');
const cierreNumTransacciones = document.getElementById('cierreNumTransacciones');
const cierreHoraApertura = document.getElementById('cierreHoraApertura');
const cierreHoraCierre = document.getElementById('cierreHoraCierre');

let resumenCajaActual = null;

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
// 9. GESTIÓN DE CAJA
// ===============================

async function verificarSesionActiva() {
  try {
    const res = await fetch(`${API_URL}/caja/sesion-activa`);
    sesionActiva = await res.json();
    
    if (sesionActiva) {
      // Hay sesión activa - mostrar info del cajero y habilitar cierre
      cajeroInfo.textContent = `Cajero: ${sesionActiva.cajero}`;
      btnCerrarCaja.style.display = 'block';
      btnCerrarCaja.disabled = false;
      ticketCheckout.disabled = false;
    } else {
      // No hay sesión - mostrar modal de apertura
      cajeroInfo.textContent = '';
      btnCerrarCaja.style.display = 'none';
      ticketCheckout.disabled = true;
      abrirModalApertura();
    }
  } catch (err) {
    console.error('Error verificando sesión:', err);
  }
}

function abrirModalApertura() {
  aperturaCajero.value = '';
  aperturaFondoBs.value = '0';
  aperturaFondoUsd.value = '0';
  aperturaOverlay.classList.add('visible');
  aperturaModal.classList.add('open');
}

function cerrarModalApertura() {
  aperturaOverlay.classList.remove('visible');
  aperturaModal.classList.remove('open');
}

aperturaCancelar.addEventListener('click', cerrarModalApertura);
aperturaOverlay.addEventListener('click', cerrarModalApertura);

aperturaConfirmar.addEventListener('click', async () => {
  const cajero = aperturaCajero.value.trim();
  const fondoBs = parseFloat(aperturaFondoBs.value) || 0;
  const fondoUsd = parseFloat(aperturaFondoUsd.value) || 0;
  
  if (!cajero) {
    alert('Ingrese el nombre del cajero');
    return;
  }
  
  try {
    const res = await fetch(`${API_URL}/caja/abrir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cajero, fondo_inicial_bs: fondoBs, fondo_inicial_usd: fondoUsd })
    });
    
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Error abriendo caja');
      return;
    }
    
    sesionActiva = await res.json();
    cerrarModalApertura();
    verificarSesionActiva();
    alert('Caja abierta exitosamente');
  } catch (err) {
    console.error('Error abriendo caja:', err);
    alert('Error abriendo caja');
  }
});

function abrirModalCierre() {
  if (!sesionActiva) return;
  
  // Cargar resumen de caja
  cargarResumenCierre();
}

async function cargarResumenCierre() {
  try {
    const res = await fetch(`${API_URL}/caja/resumen/${sesionActiva.id}`);
    resumenCajaActual = await res.json();
    
    // A. Fondo Inicial
    cierreFondoBs.textContent = `${formatNumber(resumenCajaActual.sesion.fondo_inicial_bs || 0)} Bs`;
    cierreFondoUsd.textContent = `${formatNumber(resumenCajaActual.sesion.fondo_inicial_usd || 0)} USD`;
    
    // B. Efectivo Teórico
    cierreTeoricoBs.textContent = `${formatNumber(resumenCajaActual.efectivo_teorico_bs || 0)} Bs`;
    cierreTeoricoUsd.textContent = `${formatNumber(resumenCajaActual.efectivo_teorico_usd || 0)} USD`;
    
    // C. Desglose por Método de Pago
    cierreEfectivoBs.textContent = `${formatNumber(resumenCajaActual.desglose.efectivo_bs || 0)} Bs`;
    cierreEfectivoUsd.textContent = `${formatNumber(resumenCajaActual.desglose.efectivo_usd || 0)} USD`;
    cierrePagoMovil.textContent = `${formatNumber(resumenCajaActual.desglose.pago_movil || 0)} Bs`;
    cierrePuntoVenta.textContent = `${formatNumber(resumenCajaActual.desglose.punto_venta || 0)} Bs`;
    cierreFiado.textContent = `${formatNumber(resumenCajaActual.desglose.fiado || 0)} Bs`;
    
    // F. Resumen del Turno
    cierreTotalVentas.textContent = `${formatNumber(resumenCajaActual.total_ventas || 0)} Bs`;
    cierreNumTransacciones.textContent = resumenCajaActual.num_transacciones || 0;
    cierreHoraApertura.textContent = formatHora(resumenCajaActual.sesion.fecha_apertura);
    cierreHoraCierre.textContent = formatHora(new Date().toISOString());
    
    // Resetear conteo real y diferencia
    cierreConteoBs.value = '0';
    cierreConteoUsd.value = '0';
    actualizarDiferencia();
    
    cierreOverlay.classList.add('visible');
    cierreModal.classList.add('open');
  } catch (err) {
    console.error('Error cargando resumen:', err);
    alert('Error cargando datos de cierre');
  }
}

function cerrarModalCierre() {
  cierreOverlay.classList.remove('visible');
  cierreModal.classList.remove('open');
}

cierreCancelar.addEventListener('click', cerrarModalCierre);
cierreOverlay.addEventListener('click', cerrarModalCierre);

cierreConteoBs.addEventListener('input', actualizarDiferencia);
cierreConteoUsd.addEventListener('input', actualizarDiferencia);

function actualizarDiferencia() {
  if (!resumenCajaActual) return;
  
  const conteoBs = parseFloat(cierreConteoBs.value) || 0;
  const conteoUsd = parseFloat(cierreConteoUsd.value) || 0;
  
  const diffBs = conteoBs - (resumenCajaActual.efectivo_teorico_bs || 0);
  const diffUsd = conteoUsd - (resumenCajaActual.efectivo_teorico_usd || 0);
  
  cierreDiferenciaBs.textContent = `${diffBs >= 0 ? '+' : ''}${formatNumber(diffBs)} Bs`;
  cierreDiferenciaUsd.textContent = `${diffUsd >= 0 ? '+' : ''}${formatNumber(diffUsd)} USD`;
  
  // Actualizar colores
  actualizarColorDiferencia(boxDiferenciaBs, cierreDiferenciaBs, diffBs);
  actualizarColorDiferencia(boxDiferenciaUsd, cierreDiferenciaUsd, diffUsd);
}

function actualizarColorDiferencia(box, label, diferencia) {
  box.style.borderColor = '';
  box.style.background = '';
  
  if (diferencia > 0) {
    // Sobrante - verde
    box.style.borderColor = 'rgba(34,197,94,0.5)';
    box.style.background = 'rgba(34,197,94,0.1)';
    label.style.color = '#22c55e';
  } else if (diferencia < 0) {
    // Faltante - rojo
    box.style.borderColor = 'rgba(239,68,68,0.5)';
    box.style.background = 'rgba(239,68,68,0.1)';
    label.style.color = '#ef4444';
  } else {
    // Cuadrada - verde
    box.style.borderColor = 'rgba(34,197,94,0.5)';
    box.style.background = 'rgba(34,197,94,0.1)';
    label.style.color = '#22c55e';
  }
}

cierreConfirmar.addEventListener('click', async () => {
  if (!sesionActiva) return;
  
  const conteoBs = parseFloat(cierreConteoBs.value) || 0;
  const conteoUsd = parseFloat(cierreConteoUsd.value) || 0;
  
  if (!confirm('¿Confirmar cierre de caja? Esta acción no se puede deshacer.')) {
    return;
  }
  
  try {
    const res = await fetch(`${API_URL}/caja/cerrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sesion_id: sesionActiva.id,
        conteo_real_bs: conteoBs,
        conteo_real_usd: conteoUsd
      })
    });
    
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Error cerrando caja');
      return;
    }
    
    const cierre = await res.json();
    cerrarModalCierre();
    sesionActiva = null;
    verificarSesionActiva();
    
    alert(`Caja cerrada exitosamente.\n\nDiferencia Bs: ${formatNumber(cierre.diferencia_bs || 0)}\nDiferencia USD: ${formatNumber(cierre.diferencia_usd || 0)}`);
  } catch (err) {
    console.error('Error cerrando caja:', err);
    alert('Error cerrando caja');
  }
});

btnCerrarCaja.addEventListener('click', abrirModalCierre);

function formatNumber(num) {
  return num.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatHora(isoString) {
  if (!isoString) return '--:--';
  const date = new Date(isoString);
  return date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
}

// ===============================
// 10. INICIAR
// ===============================
loadProducts();
verificarSesionActiva();
