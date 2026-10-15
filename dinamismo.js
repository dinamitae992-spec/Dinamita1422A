/* SISTEMA DE USUARIOS Y ACCESO */
let usuariosGlobales = JSON.parse(localStorage.getItem("usuariosGlobales")) || [
    { nombre: "admin", contraseña: "admin123", tipo: "administrador" }
];
let usuarioActual = JSON.parse(sessionStorage.getItem("usuarioActual")) || null;

/* OBTENER PREFIJO DE DATOS SEGÚN EL ADMINISTRADOR ACTIVO */
function obtenerPrefijo() {
    if (!usuarioActual) return "admin";
    if (usuarioActual.tipo === "administrador") {
        return usuarioActual.nombre;
    } else {
        return usuarioActual.adminDueño || "admin";
    }
}

/* CONSTANTES DE FECHA */
const nombresMeses = ["Enero", "Febrero", "", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const fechaSistemaHoy = new Date();
const anioActual = fechaSistemaHoy.getFullYear();

function obtenerMesActualNombre() {
    return nombresMeses[fechaSistemaHoy.getMonth()];
}

function calcularSemanaDelMes(fecha) {
    const primerDia = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
    return Math.ceil((fecha.getDate() + primerDia.getDay()) / 7);
}

const mesRealHoy = obtenerMesActualNombre();
const semanaRealHoy = Math.min(calcularSemanaDelMes(fechaSistemaHoy), 5);

/* ESTADO GLOBAL DEL SISTEMA */
let mesActual = mesRealHoy;
let semanaActual = semanaRealHoy;
let productoEditando = null;

/* VARIABLES DE DATOS AISLADAS */
let productos = [];
let carrito = [];
let notasVenta = [];
let ultimoNumeroVenta = 0;
let ventasPorFecha = {};
let usuariosNegocio = [];

/* CARGAR DATOS DEL ADMINISTRADOR ACTUAL */
function cargarDatosAdmin() {
    const prefijo = obtenerPrefijo();
    
    productos = JSON.parse(localStorage.getItem(`productos_${prefijo}`)) || [
        { id: 1, nombre: "Arroz", unidad: "kg", cantidad: 25, fecha: "2026-12-15", precio: 50, vendidos: 0 },
        { id: 2, nombre: "Levadura", unidad: "paquete", cantidad: 80, fecha: "2027-02-20", precio: 8, vendidos: 0 },
        { id: 3, nombre: "Aceite", unidad: "l", cantidad: 21, fecha: "2027-01-10", precio: 18, vendidos: 0 }
    ];

    carrito = JSON.parse(localStorage.getItem(`carrito_${prefijo}`)) || [];
    notasVenta = JSON.parse(localStorage.getItem(`notasVenta_${prefijo}`)) || [];
    ultimoNumeroVenta = Number(localStorage.getItem(`ultimoNumeroVenta_${prefijo}`)) || (
        notasVenta.length > 0 ? Math.max(...notasVenta.map(nota => Number(nota.numero) || 0)) : 0
    );
    ventasPorFecha = JSON.parse(localStorage.getItem(`ventasPorFecha_${prefijo}`)) || {};
    
    usuariosNegocio = JSON.parse(localStorage.getItem(`usuarios_${prefijo}`)) || [];
}

/* GUARDAR DATOS EN LOCALSTORAGE AISLADO */
function guardarDatos() {
    const prefijo = obtenerPrefijo();
    localStorage.setItem(`productos_${prefijo}`, JSON.stringify(productos));
    localStorage.setItem(`carrito_${prefijo}`, JSON.stringify(carrito));
    localStorage.setItem(`ventasPorFecha_${prefijo}`, JSON.stringify(ventasPorFecha));
    localStorage.setItem(`notasVenta_${prefijo}`, JSON.stringify(notasVenta));
    localStorage.setItem(`ultimoNumeroVenta_${prefijo}`, ultimoNumeroVenta);
    localStorage.setItem(`usuarios_${prefijo}`, JSON.stringify(usuariosNegocio));
    localStorage.setItem("usuariosGlobales", JSON.stringify(usuariosGlobales));
}

/* MOSTRAR LOGIN ADMINISTRADOR */
function mostrarLoginAdministrador() {
    const modal = document.getElementById("modalLogin");
    if (!modal) return;
    modal.style.display = "flex";
    const formulario = document.getElementById("formLogin");
    if (formulario) formulario.reset();
}

/* MOSTRAR REGISTRO */
function mostrarRegistroUsuario() {
    const modal = document.getElementById("modalRegistro");
    if (!modal) return;
    modal.style.display = "flex";
    const formulario = document.getElementById("formRegistro");
    if (formulario) formulario.reset();
}

/* CERRAR MODALES DE ACCESO */
function cerrarAcceso() {
    const login = document.getElementById("modalLogin");
    const registro = document.getElementById("modalRegistro");
    if (login) login.style.display = "none";
    if (registro) registro.style.display = "none";
}

/* ENTRAR COMO VENDEDOR */
function entrarComoVendedor() {
    const modal = document.getElementById("modalLoginVendedor");
    if (!modal) return;
    modal.style.display = "flex";
    const formulario = document.getElementById("formLoginVendedor");
    if (formulario) formulario.reset();
    const nombre = document.getElementById("loginVendedorNombre");
    if (nombre) nombre.focus();
}

function cerrarLoginVendedor() {
    const modal = document.getElementById("modalLoginVendedor");
    if (modal) modal.style.display = "none";
}

/* INICIAR SISTEMA */
function iniciarSistema(tipo) {
    cargarDatosAdmin();

    const pantallaInicio = document.getElementById("pantallaInicio");
    if (pantallaInicio) pantallaInicio.style.display = "none";

    document.body.classList.remove("sin-sesion");
    configurarPermisos(tipo);

    const seccionVentas = document.getElementById("ventadeproductos");
    const botones = document.querySelectorAll(".menu-btn");

    document.querySelectorAll(".seccion").forEach(seccion => {
        seccion.classList.remove("active-section");
    });

    botones.forEach(boton => {
        boton.classList.remove("active");
    });

    if (seccionVentas) {
        seccionVentas.classList.add("active-section");
    }

    const botonVentas = [...botones].find(boton => boton.textContent.includes("GESTION DE PRODUCTOS"));
    if (botonVentas) {
        botonVentas.classList.add("active");
    }

    actualizarTodo();
}

/* CONFIGURAR PERMISOS */
function configurarPermisos(tipo) {
    const botones = document.querySelectorAll(".menu-btn");
    botones.forEach(boton => {
        const texto = boton.textContent.trim();
        if (texto.includes("Cerrar sesión") || texto.includes("Ventas")) {
            boton.style.display = "block";
            return;
        }
        if (tipo === "administrador") {
            boton.style.display = "block";
        } else {
            boton.style.display = "none";
        }
    });
}

/* CERRAR SESIÓN */
function cerrarSesion() {
    const confirmar = confirm("¿Quieres cerrar sesión?");
    if (!confirmar) return;

    usuarioActual = null;
    sessionStorage.removeItem("usuarioActual");

    const carritoPanel = document.getElementById("carritoPanel");
    if (carritoPanel) carritoPanel.classList.remove("abierto");

    const pantallaInicio = document.getElementById("pantallaInicio");
    if (pantallaInicio) pantallaInicio.style.display = "flex";

    document.body.classList.add("sin-sesion");

    document.querySelectorAll(".seccion").forEach(seccion => {
        seccion.classList.remove("active-section");
    });

    document.querySelectorAll(".menu-btn").forEach(boton => {
        boton.classList.remove("active");
    });
}

/* CREAR NOTA DE VENTA */
function crearNotaVenta(productosVendidos, total) {
    ultimoNumeroVenta++;
    const ahora = new Date();
    const fechaHora = ahora.toLocaleString("es-BO", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit"
    });

    const productosNota = productosVendidos.map(item => {
        const producto = productos.find(p => p.id === item.id);
        if (!producto) return null;
        return {
            id: producto.id,
            nombre: producto.nombre,
            cantidad: item.cantidad,
            unidad: producto.unidad,
            precio: Number(producto.precio)
        };
    }).filter(Boolean);

    const nuevaNota = {
        numero: ultimoNumeroVenta,
        fechaHora: fechaHora,
        fecha: obtenerClaveFecha(ahora),
        mesIndex: ahora.getMonth(),
        productos: productosNota,
        total: Number(total),
        usuario: usuarioActual ? usuarioActual.nombre : "Desconocido"
    };

    notasVenta.unshift(nuevaNota);
    guardarDatos();
}

/* MOSTRAR NOTAS DE VENTA FILTRADAS POR MES */
function mostrarNotasVenta() {
    const tabla = document.getElementById("tablaNotasVenta");
    const contador = document.getElementById("cantidadNotasVenta");
    const titulo = document.getElementById("tituloNotasVentaMes");
    if (!tabla) return;

    if (titulo) titulo.textContent = `NOTAS DE VENTA (${mesActual.toUpperCase()})`;
    tabla.innerHTML = "";

    const mesIndexSeleccionado = nombresMeses.indexOf(mesActual);
    const notasFiltradas = notasVenta.filter(nota => {
        const mesNota = obtenerMesVenta(nota);
        return mesNota === mesIndexSeleccionado;
    });

    if (contador) contador.textContent = notasFiltradas.length;

    if (notasFiltradas.length === 0) {
        tabla.innerHTML = `<tr><td colspan="5" class="sin-notas">No hay notas de venta registradas en ${mesActual}.</td></tr>`;
        return;
    }

    notasFiltradas.forEach(nota => {
        const fila = document.createElement("tr");
        const productosHTML = nota.productos.map(producto => `
            <div class="producto-nota">
                ${producto.nombre} × ${producto.cantidad} ${producto.unidad} — Bs ${Number(producto.precio).toFixed(2)}
            </div>
        `).join("");

        const usuarioVenta = nota.usuario || "Desconocido";

        fila.innerHTML = `
            <td><span class="numero-venta">#${nota.numero}</span></td>
            <td>${nota.fechaHora}</td>
            <td><div class="productos-nota">${productosHTML}</div></td>
            <td><span class="vendedor-nota">${usuarioVenta}</span></td>
            <td><span class="total-nota">Bs ${Number(nota.total).toFixed(2)}</span></td>
        `;
        tabla.appendChild(fila);
    });
}

/* CAMBIAR SECCIÓN */
function mostrarSeccion(id, boton) {
    if (usuarioActual && usuarioActual.tipo === "vendedor" && id !== "ventas") return;

    document.querySelectorAll(".seccion").forEach(seccion => seccion.classList.remove("active-section"));
    document.querySelectorAll(".menu-btn").forEach(btn => btn.classList.remove("active"));

    const seccion = document.getElementById(id);
    if (seccion) seccion.classList.add("active-section");
    if (boton) boton.classList.add("active");

    actualizarTodo();
}

/* FORMATEAR FECHA */
function formatearFecha(fecha) {
    if (!fecha) return "";
    const partes = fecha.split("-");
    if (partes.length !== 3) return fecha;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

/* INVENTARIO */
function mostrarProductosTienda(lista = productos) {
    const tabla = document.getElementById("tablaTienda");
    if (!tabla) return;
    tabla.innerHTML = "";

    if (lista.length === 0) {
        tabla.innerHTML = `<tr><td colspan="6" style="text-align:center;">No se encontraron productos.</td></tr>`;
        return;
    }

    lista.forEach(producto => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${producto.id}</td>
            <td>${producto.nombre}</td>
            <td>${formatearFecha(producto.fecha)}</td>
            <td>${producto.cantidad} ${producto.unidad}</td>
            <td>Bs ${Number(producto.precio).toFixed(2)}</td>
            <td>
                <button class="vender-btn" onclick="agregarAlCarrito(${producto.id})" ${producto.cantidad <= 0 ? "disabled" : ""}>
                    Añadir al carrito
                </button>
            </td>
        `;
        tabla.appendChild(fila);
    });
}

function buscarProductoTienda() {
    const input = document.getElementById("buscarTienda");
    if (!input) return;
    const texto = input.value.toLowerCase().trim();
    const resultados = productos.filter(p => p.nombre.toLowerCase().includes(texto));
    mostrarProductosTienda(resultados);
}

/* CARRITO - CONTROLES */
function agregarAlCarrito(id) {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;
    if (producto.cantidad <= 0) {
        alert("Este producto no tiene stock.");
        return;
    }

    const existente = carrito.find(item => item.id === id);
    if (existente) {
        if (existente.cantidad < producto.cantidad) {
            existente.cantidad++;
        } else {
            alert("No puedes agregar más unidades de las disponibles.");
        }
    } else {
        carrito.push({ id: producto.id, cantidad: 1 });
    }

    guardarDatos();
    actualizarCarrito();
    abrirCarrito();
}

function toggleCarrito() {
    const panel = document.getElementById("carritoPanel");
    if (panel) panel.classList.toggle("abierto");
}

function abrirCarrito() {
    const panel = document.getElementById("carritoPanel");
    if (panel) panel.classList.add("abierto");
}

function actualizarCarrito() {
    const contenido = document.getElementById("carritoContenido");
    const contador = document.getElementById("contadorCarrito");
    const cantidadTexto = document.getElementById("cantidadCarritoTexto");
    const totalElemento = document.getElementById("totalCarrito");
    if (!contenido) return;

    contenido.innerHTML = "";
    let total = 0;
    let cantidadTotal = 0;

    if (carrito.length === 0) {
        contenido.innerHTML = `<p class="carrito-vacio">El carrito está vacío.</p>`;
    } else {
        carrito.forEach(item => {
            const producto = productos.find(p => p.id === item.id);
            if (!producto) return;

            const subtotal = producto.precio * item.cantidad;
            total += subtotal;
            cantidadTotal += item.cantidad;

            const div = document.createElement("div");
            div.className = "item-carrito";
            div.innerHTML = `
                <div class="item-carrito-superior">
                    <span class="item-carrito-nombre">${producto.nombre}</span>
                    <span class="item-carrito-precio">Bs ${subtotal.toFixed(2)}</span>
                </div>
                <div class="item-carrito-controles">
                    <div class="control-cantidad">
                        <button type="button" onclick="cambiarCantidadCarrito(${producto.id}, -1)">−</button>
                        <input type="number" min="1" max="${producto.cantidad}" value="${item.cantidad}" onchange="cantidadManualCarrito(${producto.id}, this.value)">
                        <button type="button" onclick="cambiarCantidadCarrito(${producto.id}, 1)">+</button>
                    </div>
                    <span>${producto.unidad}</span>
                    <button type="button" class="btn-eliminar-carrito" onclick="eliminarDelCarrito(${producto.id})">Eliminar</button>
                </div>
            `;
            contenido.appendChild(div);
        });
    }

    if (contador) contador.textContent = cantidadTotal;
    if (cantidadTexto) cantidadTexto.textContent = cantidadTotal === 1 ? "1 producto" : `${cantidadTotal} productos`;
    if (totalElemento) totalElemento.textContent = `Bs ${total.toFixed(2)}`;
}

function cambiarCantidadCarrito(id, cambio) {
    const item = carrito.find(p => p.id === id);
    const producto = productos.find(p => p.id === id);
    if (!item || !producto) return;

    const nuevaCantidad = item.cantidad + cambio;
    if (nuevaCantidad <= 0) {
        eliminarDelCarrito(id);
        return;
    }
    if (nuevaCantidad > producto.cantidad) {
        alert(`Solo hay ${producto.cantidad} ${producto.unidad} disponibles.`);
        return;
    }

    item.cantidad = nuevaCantidad;
    guardarDatos();
    actualizarCarrito();
}

function cantidadManualCarrito(id, valor) {
    const item = carrito.find(p => p.id === id);
    const producto = productos.find(p => p.id === id);
    if (!item || !producto) return;

    let cantidad = parseFloat(valor);
    if (isNaN(cantidad) || cantidad < 1) cantidad = 1;
    if (cantidad > producto.cantidad) {
        alert(`Solo hay ${producto.cantidad} ${producto.unidad} disponibles.`);
        cantidad = producto.cantidad;
    }

    item.cantidad = cantidad;
    guardarDatos();
    actualizarCarrito();
}

function eliminarDelCarrito(id) {
    carrito = carrito.filter(item => item.id !== id);
    guardarDatos();
    actualizarCarrito();
}

function vaciarCarrito() {
    if (carrito.length === 0) return;
    if (!confirm("¿Quieres vaciar todo el carrito?")) return;
    carrito = [];
    guardarDatos();
    actualizarCarrito();
}

/* FECHAS Y SEMANAS */
function obtenerClaveFecha(fecha) {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return `${año}-${mes}-${dia}`;
}

function obtenerDiasDelMes(mesIndex) {
    return new Date(anioActual, mesIndex + 1, 0).getDate();
}

function obtenerDiasSemana(mesIndex, semana) {
    const diasDelMes = obtenerDiasDelMes(mesIndex);
    let inicio = 1;
    if (semana === 2) inicio = 8;
    else if (semana === 3) inicio = 15;
    else if (semana === 4) inicio = 22;
    else if (semana === 5) inicio = 29;

    if (inicio > diasDelMes) return [];

    const dias = [];
    const cantidad = Math.min(7, diasDelMes - inicio + 1);
    for (let i = 0; i < cantidad; i++) {
        dias.push(inicio + i);
    }
    return dias;
}

function registrarVentaEnGrafica(total) {
    const hoy = new Date();
    const claveFecha = obtenerClaveFecha(hoy);
    ventasPorFecha[claveFecha] = (Number(ventasPorFecha[claveFecha]) || 0) + Number(total);
}

function confirmarCompra() {
    if (carrito.length === 0) {
        alert("El carrito está vacío.");
        return;
    }

    for (const item of carrito) {
        const producto = productos.find(p => p.id === item.id);
        if (!producto) continue;
        if (item.cantidad > producto.cantidad) {
            alert(`No hay suficiente stock de ${producto.nombre}.`);
            return;
        }
    }

    let total = 0;
    carrito.forEach(item => {
        const producto = productos.find(p => p.id === item.id);
        if (!producto) return;
        producto.cantidad -= item.cantidad;
        producto.vendidos = (producto.vendidos || 0) + item.cantidad;
        total += producto.precio * item.cantidad;
    });

    registrarVentaEnGrafica(total);
    crearNotaVenta([...carrito], total);
    carrito = [];

    guardarDatos();
    actualizarTodo();

    const panel = document.getElementById("carritoPanel");
    if (panel) panel.classList.remove("abierto");

    alert(`Compra confirmada.\nTotal: Bs ${total.toFixed(2)}`);
}

function obtenerMesVenta(nota) {
    if (!nota) return null;
    if (typeof nota.mesIndex === "number") return nota.mesIndex;
    if (typeof nota.fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(nota.fecha)) {
        const mes = Number(nota.fecha.substring(5, 7)) - 1;
        if (mes >= 0 && mes <= 11) return mes;
    }
    if (typeof nota.fechaHora === "string") {
        const coincidencia = nota.fechaHora.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (coincidencia) {
            const mes = Number(coincidencia[2]) - 1;
            if (mes >= 0 && mes <= 11) return mes;
        }
    }
    return null;
}

function escapeHtmlRecursos(texto) {
    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function mostrarProductosVendidos() {
    const tabla = document.getElementById("tablaProductos");
    if (!tabla) return;
    tabla.innerHTML = "";

    let titulo = document.getElementById("tituloProductosVendidos");
    if (titulo) titulo.textContent = `PRODUCTOS VENDIDOS EN ${mesActual.toUpperCase()}`;

    const mesIndex = nombresMeses.indexOf(mesActual);
    if (mesIndex < 0) return;

    const ventasDelMes = notasVenta.filter(nota => obtenerMesVenta(nota) === mesIndex);
    const cantidades = {};

    ventasDelMes.forEach(nota => {
        if (!Array.isArray(nota.productos)) return;
        nota.productos.forEach(item => {
            if (!item || !item.nombre) return;
            const nombre = String(item.nombre);
            const cantidad = Number(item.cantidad) || 0;
            if (cantidad <= 0) return;

            if (!cantidades[nombre]) {
                cantidades[nombre] = { nombre: nombre, cantidad: 0, unidad: item.unidad || "" };
            }
            cantidades[nombre].cantidad += cantidad;
        });
    });

    const productosVendidos = Object.values(cantidades).sort((a, b) => b.cantidad - a.cantidad);

    if (productosVendidos.length === 0) {
        tabla.innerHTML = `<tr><td colspan="2" style="text-align:center;">Sin ventas en este mes</td></tr>`;
        return;
    }

    productosVendidos.forEach(producto => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${escapeHtmlRecursos(producto.nombre)}</td>
            <td>${producto.cantidad} ${escapeHtmlRecursos(producto.unidad)}</td>
        `;
        tabla.appendChild(fila);
    });
}

function actualizarDemanda() {
    const seccion = document.querySelector("#reportes");
    if (!seccion) return;

    const tituloDemanda = document.getElementById("tituloDemandaProductos");
    if (tituloDemanda) {
        tituloDemanda.textContent = `DEMANDA DE PRODUCTOS (${mesActual.toUpperCase()})`;
    }

    const tablas = seccion.querySelectorAll(".tabla-demanda table");
    if (tablas.length < 2) return;

    const tbodyDemanda = tablas[0].querySelector("tbody");
    if (!tbodyDemanda) return;
    tbodyDemanda.innerHTML = "";

    const mesIndex = nombresMeses.indexOf(mesActual);
    const ventasDelMes = notasVenta.filter(nota => obtenerMesVenta(nota) === mesIndex);
    const conteoVentasMes = {};

    ventasDelMes.forEach(nota => {
        if (!Array.isArray(nota.productos)) return;
        nota.productos.forEach(p => {
            const nombre = p.nombre;
            conteoVentasMes[nombre] = (conteoVentasMes[nombre] || 0) + (Number(p.cantidad) || 0);
        });
    });

    const productosConDemandaMes = productos.map(p => ({
        ...p,
        vendidosMes: conteoVentasMes[p.nombre] || 0
    }));

    const masVendidos = [...productosConDemandaMes]
        .filter(p => p.vendidosMes > 0)
        .sort((a, b) => b.vendidosMes - a.vendidosMes);

    const menosVendidos = [...productosConDemandaMes]
        .sort((a, b) => a.vendidosMes - b.vendidosMes);

    const cantidadFilas = Math.max(masVendidos.length, 4);

    for (let i = 0; i < cantidadFilas; i++) {
        const mas = masVendidos[i];
        const menos = menosVendidos[i];
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${mas ? `${mas.nombre} (${mas.vendidosMes})` : "-"}</td>
            <td>${menos ? `${menos.nombre} (${menos.vendidosMes})` : "-"}</td>
        `;
        tbodyDemanda.appendChild(fila);
    }

    const tbodyAbastecer = tablas[1].querySelector("tbody");
    if (!tbodyAbastecer) return;
    tbodyAbastecer.innerHTML = "";

    const abastecer = [...productos].filter(p => p.cantidad <= 20).sort((a, b) => a.cantidad - b.cantidad);
    if (abastecer.length === 0) {
        tbodyAbastecer.innerHTML = `<tr><td colspan="2">No hay productos por abastecer.</td></tr>`;
    } else {
        abastecer.forEach(producto => {
            const fila = document.createElement("tr");
            fila.innerHTML = `<td>${producto.nombre}</td><td>${producto.cantidad} ${producto.unidad}</td>`;
            tbodyAbastecer.appendChild(fila);
        });
    }
}

function mostrarProductosAdmin(lista = productos) {
    const tabla = document.getElementById("tablaProductosAdmin");
    if (!tabla) return;
    tabla.innerHTML = "";

    if (lista.length === 0) {
        tabla.innerHTML = `<tr><td colspan="6" style="text-align:center;">No se encontraron productos.</td></tr>`;
        return;
    }

    lista.forEach((producto, index) => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${index + 1}</td>
            <td>${producto.nombre}</td>
            <td>${formatearFecha(producto.fecha)}</td>
            <td>${producto.cantidad} ${producto.unidad}</td>
            <td>Bs ${Number(producto.precio).toFixed(2)}</td>
            <td>
                <button class="editar-btn" onclick="abrirFormularioModificar(${producto.id})">Modificar</button>
            </td>
        `;
        tabla.appendChild(fila);
    });

    mostrarUsuariosAdmin();
}

function buscarProductoAdmin() {
    const input = document.getElementById("buscarAdmin");
    if (!input) return;
    const texto = input.value.toLowerCase().trim();
    const resultados = productos.filter(p => p.nombre.toLowerCase().includes(texto));
    mostrarProductosAdmin(resultados);
}

function abrirFormularioAgregar() {
    if (!usuarioActual || usuarioActual.tipo !== "administrador") {
        alert("Solo el administrador puede modificar productos.");
        return;
    }
    productoEditando = null;
    document.getElementById("modal").style.display = "flex";
    document.getElementById("formProducto").reset();
    document.getElementById("btnEliminar").style.display = "none";
}

function abrirFormularioModificar(id) {
    if (!usuarioActual || usuarioActual.tipo !== "administrador") {
        alert("Solo el administrador puede modificar productos.");
        return;
    }
    const producto = productos.find(p => p.id === id);
    if (!producto) return;

    productoEditando = id;
    document.getElementById("modal").style.display = "flex";
    document.getElementById("producto").value = producto.nombre;
    document.getElementById("unidad").value = producto.unidad;
    document.getElementById("cantidad").value = producto.cantidad;
    document.getElementById("fecha").value = producto.fecha;
    document.getElementById("precio").value = producto.precio;
    document.getElementById("btnEliminar").style.display = "block";
}

function cerrarFormulario() {
    document.getElementById("modal").style.display = "none";
    productoEditando = null;
}

function eliminarProducto() {
    if (!usuarioActual || usuarioActual.tipo !== "administrador") {
        alert("Solo el administrador puede eliminar productos.");
        return;
    }
    if (productoEditando === null) return;

    const producto = productos.find(p => p.id === productoEditando);
    if (!producto) return;

    if (!confirm(`¿Quieres eliminar "${producto.nombre}"?`)) return;

    productos = productos.filter(p => p.id !== productoEditando);
    carrito = carrito.filter(item => item.id !== productoEditando);

    guardarDatos();
    cerrarFormulario();
    actualizarTodo();
}

/* USUARIOS ADMINISTRACIÓN */
function abrirFormularioUsuarioAdmin() {
    const el = document.getElementById("formularioUsuarioAdmin");
    if (el) el.style.display = el.style.display === "none" ? "flex" : "none";
}

function mostrarUsuariosAdmin() {
    const tabla = document.getElementById("tablaUsuariosAdmin");
    if (!tabla) return;
    tabla.innerHTML = "";

    usuariosNegocio.forEach((u, index) => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${index + 1}</td>
            <td>${u.tipo}</td>
            <td>${u.nombre}</td>
            <td>
                <button class="btn-eliminar-usuario-admin" onclick="eliminarUsuario(${index})">Eliminar</button>
            </td>
        `;
        tabla.appendChild(fila);
    });
}

function eliminarUsuario(index) {
    if (!confirm(`¿Deseas eliminar el usuario ${usuariosNegocio[index].nombre}?`)) return;
    const eliminado = usuariosNegocio.splice(index, 1)[0];
    
    // También remover de la lista global de acceso si es necesario
    usuariosGlobales = usuariosGlobales.filter(u => u.nombre !== eliminado.nombre);
    
    guardarDatos();
    mostrarUsuariosAdmin();
}

function actualizarInfoUsuarioHeader() {
    const infoHeader = document.getElementById("infoUsuarioHeader");
    if (!infoHeader) return;

    if (usuarioActual) {
        infoHeader.style.display = "flex";
        infoHeader.innerHTML = `👤 ${usuarioActual.nombre} | <strong>(${usuarioActual.tipo.toUpperCase()})</strong>`;
    } else {
        infoHeader.style.display = "none";
        infoHeader.innerHTML = "";
    }
}

function cambiarMesGlobal(mes) {
    mesActual = mes;
    const mesIndex = nombresMeses.indexOf(mesActual);
    const dias = obtenerDiasSemana(mesIndex, semanaActual);
    if (dias.length === 0) semanaActual = 1;
    actualizarTodo();
}

function cambiarSemanaGlobal(semana) {
    const mesIndex = nombresMeses.indexOf(mesActual);
    const dias = obtenerDiasSemana(mesIndex, semana);
    if (dias.length === 0) return;
    semanaActual = semana;
    actualizarTodo();
}

function irAMesYSemanaActual() {
    mesActual = mesRealHoy;
    semanaActual = semanaRealHoy;
    actualizarTodo();
}

function actualizarIndicadorSuperior() {
    const indicadorMes = document.getElementById("indicadorMesSuperior");
    const badgeSemana = document.getElementById("badgeSemanaActual");

    if (indicadorMes) {
        indicadorMes.textContent = `📅 Mostrando: ${mesActual} ${anioActual}`;
    }

    if (badgeSemana) {
        const esHoy = (mesActual === mesRealHoy);
        if (esHoy) {
            badgeSemana.textContent = `📌 Semana actual: S${semanaRealHoy}`;
            badgeSemana.style.display = "inline-block";
        } else {
            badgeSemana.textContent = `📌 Semana visualizada: S${semanaActual}`;
            badgeSemana.style.display = "inline-block";
        }
    }

    const selectDemanda = document.getElementById("selectMesDemanda");
    if (selectDemanda) selectDemanda.value = mesActual;

    const selectNotas = document.getElementById("selectMesNotas");
    if (selectNotas) selectNotas.value = mesActual;

    document.querySelectorAll(".meses button").forEach(btn => {
        btn.classList.toggle("activo", btn.textContent.trim() === mesActual);
    });

    document.querySelectorAll(".semanas button").forEach(btn => {
        const esSemanaBoton = btn.textContent.includes(`Semana ${semanaActual}`);
        btn.classList.toggle("activo", esSemanaBoton);

        if (mesActual === mesRealHoy && btn.textContent.includes(`Semana ${semanaRealHoy}`)) {
            btn.classList.add("semana-actual-resaltada");
        } else {
            btn.classList.remove("semana-actual-resaltada");
        }
    });
}

function actualizarBotonesSemana() {
    const botonSemana5 = document.getElementById("semana5");
    if (!botonSemana5) return;

    const mesIndex = nombresMeses.indexOf(mesActual);
    const diasDelMes = obtenerDiasDelMes(mesIndex);

    if (diasDelMes > 28) {
        botonSemana5.style.display = "inline-block";
    } else {
        botonSemana5.style.display = "none";
        if (semanaActual === 5) semanaActual = 1;
    }
}

function actualizarGrafica() {
    const grafica = document.getElementById("grafica");
    if (!grafica) return;
    grafica.innerHTML = "";

    const mesIndex = nombresMeses.indexOf(mesActual);
    const dias = obtenerDiasSemana(mesIndex, semanaActual);
    const numeroMes = String(mesIndex + 1).padStart(2, "0");

    const valores = [];
    dias.forEach(dia => {
        const numeroDia = String(dia).padStart(2, "0");
        const claveFecha = `${anioActual}-${numeroMes}-${numeroDia}`;
        const valor = Number(ventasPorFecha[claveFecha]) || 0;
        valores.push({ dia, fecha: claveFecha, valor });
    });

    const maximo = Math.max(...valores.map(item => item.valor), 1);
    let total = 0;

    valores.forEach(item => {
        total += item.valor;
        const barra = document.createElement("div");
        barra.className = "barra";

        const valorTexto = document.createElement("span");
        valorTexto.className = "valor";
        valorTexto.textContent = item.valor > 0 ? `Bs ${item.valor.toFixed(2)}` : "—";

        const barraInterior = document.createElement("div");
        barraInterior.className = "barra-interior";
        const altura = item.valor > 0 ? (item.valor / maximo) * 280 : 0;
        barraInterior.style.height = `${altura}px`;

        const fecha = document.createElement("small");
        fecha.textContent = `${String(item.dia).padStart(2, "0")}/${numeroMes}`;

        barra.appendChild(valorTexto);
        barra.appendChild(barraInterior);
        barra.appendChild(fecha);
        grafica.appendChild(barra);
    });

    const totalElemento = document.getElementById("totalGanancias");
    if (totalElemento) totalElemento.textContent = `Bs ${total.toFixed(2)}`;

    const titulo = document.getElementById("tituloGrafica");
    if (titulo && dias.length > 0) {
        const primerDia = String(dias[0]).padStart(2, "0");
        const ultimoDia = String(dias[dias.length - 1]).padStart(2, "0");
        titulo.textContent = `GANANCIAS DEL ${primerDia}/${numeroMes}/${anioActual} AL ${ultimoDia}/${numeroMes}/${anioActual}`;
    }
}

function actualizarTodo() {
    actualizarInfoUsuarioHeader();
    actualizarIndicadorSuperior();
    mostrarProductosTienda();
    mostrarProductosVendidos();
    mostrarProductosAdmin();
    actualizarDemanda();
    actualizarCarrito();
    actualizarBotonesSemana();
    actualizarGrafica();
    mostrarNotasVenta();
}

/* INICIALIZACIÓN Y EVENT LISTENERS */
document.addEventListener("DOMContentLoaded", function() {
    const formProd = document.getElementById("formProducto");
    if (formProd) {
        formProd.addEventListener("submit", function(event) {
            event.preventDefault();
            if (!usuarioActual || usuarioActual.tipo !== "administrador") {
                alert("Solo el administrador puede modificar productos.");
                return;
            }

            const nombre = document.getElementById("producto").value.trim();
            const unidad = document.getElementById("unidad").value;
            const cantidad = parseFloat(document.getElementById("cantidad").value);
            const fecha = document.getElementById("fecha").value;
            const precio = parseFloat(document.getElementById("precio").value);

            if (!nombre || !fecha || isNaN(cantidad) || isNaN(precio)) {
                alert("Completa correctamente todos los campos.");
                return;
            }

            if (productoEditando !== null) {
                const producto = productos.find(p => p.id === productoEditando);
                if (producto) {
                    producto.nombre = nombre;
                    producto.unidad = unidad;
                    producto.cantidad = cantidad;
                    producto.fecha = fecha;
                    producto.precio = precio;
                }
            } else {
                const nuevoId = productos.length > 0 ? Math.max(...productos.map(p => p.id)) + 1 : 1;
                productos.push({ id: nuevoId, nombre, unidad, cantidad, fecha, precio, vendidos: 0 });
            }

            guardarDatos();
            cerrarFormulario();
            actualizarTodo();
        });
    }

    const formLogin = document.getElementById("formLogin");
    if (formLogin) {
        formLogin.addEventListener("submit", function(event) {
            event.preventDefault();
            const nombre = document.getElementById("loginNombre").value.trim();
            const contraseña = document.getElementById("loginPassword").value;

            const usuario = usuariosGlobales.find(u => u.nombre.toLowerCase() === nombre.toLowerCase() && u.contraseña === contraseña && u.tipo === "administrador");
            if (!usuario) {
                alert("Nombre o contraseña incorrectos, o no eres administrador.");
                return;
            }

            usuarioActual = { nombre: usuario.nombre, tipo: usuario.tipo };
            sessionStorage.setItem("usuarioActual", JSON.stringify(usuarioActual));
            cerrarAcceso();
            iniciarSistema("administrador");
        });
    }

    const formReg = document.getElementById("formRegistro");
    if (formReg) {
        formReg.addEventListener("submit", function(event) {
            event.preventDefault();
            const nombre = document.getElementById("registroNombre").value.trim();
            const contraseña = document.getElementById("registroPassword").value;

            if (usuariosGlobales.some(u => u.nombre.toLowerCase() === nombre.toLowerCase())) {
                alert("El nombre de usuario ya existe.");
                return;
            }

            const nuevoAdmin = { nombre, contraseña, tipo: "administrador" };
            usuariosGlobales.push(nuevoAdmin);
            
            usuarioActual = { nombre: nuevoAdmin.nombre, tipo: nuevoAdmin.tipo };
            sessionStorage.setItem("usuarioActual", JSON.stringify(usuarioActual));
            
            guardarDatos();
            cerrarAcceso();
            iniciarSistema("administrador");
        });
    }

    const formLoginVendedor = document.getElementById("formLoginVendedor");
    if (formLoginVendedor) {
        formLoginVendedor.addEventListener("submit", function(event) {
            event.preventDefault();
            const nombre = document.getElementById("loginVendedorNombre").value.trim();
            const contraseña = document.getElementById("loginVendedorPassword").value;

            // Buscar en todos los administradores el vendedor correspondiente
            let vendedorEncontrado = null;
            let adminPropietario = null;

            for (const admin of usuariosGlobales.filter(u => u.tipo === "administrador")) {
                const usuariosDelAdmin = JSON.parse(localStorage.getItem(`usuarios_${admin.nombre}`)) || [];
                const v = usuariosDelAdmin.find(user => user.nombre.toLowerCase() === nombre.toLowerCase() && user.contraseña === contraseña && user.tipo === "vendedor");
                if (v) {
                    vendedorEncontrado = v;
                    adminPropietario = admin.nombre;
                    break;
                }
            }

            if (!vendedorEncontrado) {
                alert("Nombre o contraseña de vendedor incorrectos.");
                return;
            }

            usuarioActual = { nombre: vendedorEncontrado.nombre, tipo: vendedorEncontrado.tipo, adminDueño: adminPropietario };
            sessionStorage.setItem("usuarioActual", JSON.stringify(usuarioActual));
            cerrarLoginVendedor();
            iniciarSistema("vendedor");
        });
    }

    const formUserAdmin = document.getElementById("formUsuarioAdmin");
    if (formUserAdmin) {
        formUserAdmin.addEventListener("submit", function(e) {
            e.preventDefault();
            const nombre = document.getElementById("adminUsuarioNombre").value.trim();
            const contraseña = document.getElementById("adminUsuarioPassword").value;
            const tipo = document.getElementById("adminUsuarioTipo").value;

            // Verificar si ya existe globalmente
            if (usuariosGlobales.some(u => u.nombre.toLowerCase() === nombre.toLowerCase()) || usuariosNegocio.some(u => u.nombre.toLowerCase() === nombre.toLowerCase())) {
                alert("El nombre de usuario ya existe.");
                return;
            }

            const nuevoUser = { nombre, contraseña, tipo };
            usuariosNegocio.push(nuevoUser);

            if (tipo === "administrador") {
                usuariosGlobales.push(nuevoUser);
            }

            guardarDatos();
            formUserAdmin.reset();
            document.getElementById("formularioUsuarioAdmin").style.display = "none";
            mostrarUsuariosAdmin();
            alert("Usuario agregado con éxito.");
        });
    }

    if (usuarioActual) {
        iniciarSistema(usuarioActual.tipo);
    }
});
