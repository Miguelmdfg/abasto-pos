// Simulación temporal de usuarios (hasta conectar SQLite)
let users = JSON.parse(localStorage.getItem("bodega_users")) || [];

// Guardar usuarios en localStorage
function saveUsers() {
  localStorage.setItem("bodega_users", JSON.stringify(users));
}

// LOGIN
const loginBtn = document.getElementById("loginBtn");

if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!email || !password) {
      alert("Por favor completa todos los campos.");
      return;
    }

    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      alert("Correo o contraseña incorrectos.");
      return;
    }

    // Guardar sesión
    localStorage.setItem("bodega_session", JSON.stringify(user));

    // Redirigir al POS
    window.location.href = "pos.html";
  });
}

// REGISTRO
const registerBtn = document.getElementById("registerBtn");

if (registerBtn) {
  registerBtn.addEventListener("click", () => {
    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value.trim();

    if (!name || !email || !password) {
      alert("Por favor completa todos los campos.");
      return;
    }

    if (users.some(u => u.email === email)) {
      alert("Este correo ya está registrado.");
      return;
    }

    const newUser = { name, email, password, role: "cajera" };
    users.push(newUser);
    saveUsers();

    alert("Cuenta creada con éxito. Ahora puedes iniciar sesión.");
    window.location.href = "login.html";
  });
}

// PROTEGER PÁGINAS INTERNAS
function requireLogin() {
  const session = JSON.parse(localStorage.getItem("bodega_session"));
  if (!session) {
    window.location.href = "login.html";
  }
}

// Cerrar sesión
function logout() {
  localStorage.removeItem("bodega_session");
  window.location.href = "login.html";
}
