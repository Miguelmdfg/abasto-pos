#!/bin/bash

# ================================================================
# REORGANIZACIÓN DE VISTAS — BODEGA FLOW
# Estructura basada en el flujo real del sistema
#
# CÓMO USAR:
# 1. Copia este archivo dentro de la carpeta "Imagenes"
# 2. Clic derecho dentro de "Imagenes" → Git Bash Here
# 3. Escribe: bash reorganizar_vistas.sh
# ================================================================

echo ""
echo "================================================"
echo "  BODEGA FLOW — Reorganizando vistas..."
echo "================================================"
echo ""

# ----------------------------------------------------------------
# 01 - AUTENTICACION
# El primer paso del flujo: el usuario inicia sesion
# ----------------------------------------------------------------
mkdir -p "01_autenticacion/login_modo_claro"
mkdir -p "01_autenticacion/login_modo_oscuro"

[ -d "login_screen_light_mode" ] && mv "login_screen_light_mode" "01_autenticacion/login_modo_claro"
[ -d "login_screen_dark_mode"  ] && mv "login_screen_dark_mode"  "01_autenticacion/login_modo_oscuro"

echo "✔ 01_autenticacion"

# ----------------------------------------------------------------
# 02 - PUNTO DE VENTA
# El vendedor registra ventas desde el POS
# ----------------------------------------------------------------
mkdir -p "02_punto_de_venta/pantalla_principal_modo_claro_variante_1"
mkdir -p "02_punto_de_venta/pantalla_principal_modo_claro_variante_2"
mkdir -p "02_punto_de_venta/modal_cobro_modo_oscuro_variante_1"
mkdir -p "02_punto_de_venta/modal_cobro_modo_oscuro_variante_2"

[ -d "pos_main_interface_light_mode_1" ] && mv "pos_main_interface_light_mode_1" "02_punto_de_venta/pantalla_principal_modo_claro_variante_1"
[ -d "pos_main_interface_light_mode_2" ] && mv "pos_main_interface_light_mode_2" "02_punto_de_venta/pantalla_principal_modo_claro_variante_2"
[ -d "pos_payment_modal_dark_mode_1"   ] && mv "pos_payment_modal_dark_mode_1"   "02_punto_de_venta/modal_cobro_modo_oscuro_variante_1"
[ -d "pos_payment_modal_dark_mode_2"   ] && mv "pos_payment_modal_dark_mode_2"   "02_punto_de_venta/modal_cobro_modo_oscuro_variante_2"

echo "✔ 02_punto_de_venta"

# ----------------------------------------------------------------
# 03 - INVENTARIO
# Vista del vendedor (consulta) y del dueño (gestion completa)
# ----------------------------------------------------------------
mkdir -p "03_inventario/vista_vendedor_lista_modo_oscuro"
mkdir -p "03_inventario/vista_vendedor_catalogo_modo_claro"
mkdir -p "03_inventario/vista_dueno_gestion_modo_claro_variante_1"
mkdir -p "03_inventario/vista_dueno_gestion_modo_claro_variante_2"
mkdir -p "03_inventario/vista_dueno_gestion_modo_oscuro_variante_1"
mkdir -p "03_inventario/vista_dueno_gestion_modo_oscuro_variante_2"

[ -d "inventory_table_list_view_dark"      ] && mv "inventory_table_list_view_dark"      "03_inventario/vista_vendedor_lista_modo_oscuro"
[ -d "inventory_catalog_grid_view_light"   ] && mv "inventory_catalog_grid_view_light"   "03_inventario/vista_vendedor_catalogo_modo_claro"
[ -d "owner_inventory_admin_view_light_1"  ] && mv "owner_inventory_admin_view_light_1"  "03_inventario/vista_dueno_gestion_modo_claro_variante_1"
[ -d "owner_inventory_admin_view_light_2"  ] && mv "owner_inventory_admin_view_light_2"  "03_inventario/vista_dueno_gestion_modo_claro_variante_2"
[ -d "owner_inventory_admin_view_dark_1"   ] && mv "owner_inventory_admin_view_dark_1"   "03_inventario/vista_dueno_gestion_modo_oscuro_variante_1"
[ -d "owner_inventory_admin_view_dark_2"   ] && mv "owner_inventory_admin_view_dark_2"   "03_inventario/vista_dueno_gestion_modo_oscuro_variante_2"

echo "✔ 03_inventario"

# ----------------------------------------------------------------
# 04 - CIERRE DE CAJA
# El vendedor cierra su turno y el dueno revisa el resumen
# ----------------------------------------------------------------
mkdir -p "04_cierre_de_caja/reporte_cierres_modo_claro_variante_1"
mkdir -p "04_cierre_de_caja/reporte_cierres_modo_claro_variante_2"
mkdir -p "04_cierre_de_caja/detalle_cierre_modo_oscuro_variante_1"
mkdir -p "04_cierre_de_caja/detalle_cierre_modo_oscuro_variante_2"

[ -d "cash_closing_reports_light_mode_1"  ] && mv "cash_closing_reports_light_mode_1"  "04_cierre_de_caja/reporte_cierres_modo_claro_variante_1"
[ -d "cash_closing_reports_light_mode_2"  ] && mv "cash_closing_reports_light_mode_2"  "04_cierre_de_caja/reporte_cierres_modo_claro_variante_2"
[ -d "detailed_cash_closing_dark_mode_1"  ] && mv "detailed_cash_closing_dark_mode_1"  "04_cierre_de_caja/detalle_cierre_modo_oscuro_variante_1"
[ -d "detailed_cash_closing_dark_mode_2"  ] && mv "detailed_cash_closing_dark_mode_2"  "04_cierre_de_caja/detalle_cierre_modo_oscuro_variante_2"

echo "✔ 04_cierre_de_caja"

# ----------------------------------------------------------------
# 05 - GESTION DE DEUDAS
# El dueno controla las ventas fiadas y los abonos
# ----------------------------------------------------------------
mkdir -p "05_gestion_de_deudas/lista_de_clientes_modo_claro_variante_1"
mkdir -p "05_gestion_de_deudas/lista_de_clientes_modo_claro_variante_2"
mkdir -p "05_gestion_de_deudas/modal_registrar_abono_modo_oscuro_variante_1"
mkdir -p "05_gestion_de_deudas/modal_registrar_abono_modo_oscuro_variante_2"

[ -d "debt_management_main_view_light_1"  ] && mv "debt_management_main_view_light_1"  "05_gestion_de_deudas/lista_de_clientes_modo_claro_variante_1"
[ -d "debt_management_main_view_light_2"  ] && mv "debt_management_main_view_light_2"  "05_gestion_de_deudas/lista_de_clientes_modo_claro_variante_2"
[ -d "debt_detail_payment_modal_dark_1"   ] && mv "debt_detail_payment_modal_dark_1"   "05_gestion_de_deudas/modal_registrar_abono_modo_oscuro_variante_1"
[ -d "debt_detail_payment_modal_dark_2"   ] && mv "debt_detail_payment_modal_dark_2"   "05_gestion_de_deudas/modal_registrar_abono_modo_oscuro_variante_2"

echo "✔ 05_gestion_de_deudas"

# ----------------------------------------------------------------
# 06 - PAGO MOVIL
# Registro y verificacion de transferencias por pago movil
# ----------------------------------------------------------------
mkdir -p "06_pago_movil/historial_transacciones_modo_claro"
mkdir -p "06_pago_movil/historial_transacciones_modo_oscuro"

[ -d "mobile_payment_logs_light_mode" ] && mv "mobile_payment_logs_light_mode" "06_pago_movil/historial_transacciones_modo_claro"
[ -d "mobile_payment_logs_dark_mode"  ] && mv "mobile_payment_logs_dark_mode"  "06_pago_movil/historial_transacciones_modo_oscuro"

echo "✔ 06_pago_movil"

# ----------------------------------------------------------------
# 07 - PROVEEDORES
# Registro de proveedores y compras para reponer inventario
# ----------------------------------------------------------------
mkdir -p "07_proveedores/gestion_proveedores_modo_claro"
mkdir -p "07_proveedores/gestion_proveedores_modo_oscuro"

[ -d "proveedores_modo_claro"  ] && mv "proveedores_modo_claro"  "07_proveedores/gestion_proveedores_modo_claro"
[ -d "proveedores_modo_oscuro" ] && mv "proveedores_modo_oscuro" "07_proveedores/gestion_proveedores_modo_oscuro"

echo "✔ 07_proveedores"

# ----------------------------------------------------------------
# 08 - ANALITICAS
# Dashboard ejecutivo para el dueno con metricas del negocio
# ----------------------------------------------------------------
mkdir -p "08_analiticas/dashboard_ejecutivo_modo_claro"
mkdir -p "08_analiticas/dashboard_ejecutivo_modo_oscuro"

[ -d "dashboard_de_anal_ticas_modo_claro"  ] && mv "dashboard_de_anal_ticas_modo_claro"  "08_analiticas/dashboard_ejecutivo_modo_claro"
[ -d "dashboard_de_anal_ticas_modo_oscuro" ] && mv "dashboard_de_anal_ticas_modo_oscuro" "08_analiticas/dashboard_ejecutivo_modo_oscuro"

echo "✔ 08_analiticas"

# ----------------------------------------------------------------
# 09 - CONTROL DE COSTOS
# El dueno revisa margenes, costos y rentabilidad por producto
# ----------------------------------------------------------------
mkdir -p "09_control_de_costos/analisis_rentabilidad_modo_claro"
mkdir -p "09_control_de_costos/analisis_rentabilidad_modo_oscuro"

[ -d "control_de_costos_modo_claro"  ] && mv "control_de_costos_modo_claro"  "09_control_de_costos/analisis_rentabilidad_modo_claro"
[ -d "control_de_costos_modo_oscuro" ] && mv "control_de_costos_modo_oscuro" "09_control_de_costos/analisis_rentabilidad_modo_oscuro"

echo "✔ 09_control_de_costos"

# ----------------------------------------------------------------
# 10 - USUARIOS Y PERMISOS
# El dueno crea y gestiona los usuarios del sistema
# ----------------------------------------------------------------
mkdir -p "10_usuarios_y_permisos/gestion_de_usuarios_modo_claro"
mkdir -p "10_usuarios_y_permisos/gestion_de_usuarios_modo_oscuro"

[ -d "usuarios_y_permisos_modo_claro"  ] && mv "usuarios_y_permisos_modo_claro"  "10_usuarios_y_permisos/gestion_de_usuarios_modo_claro"
[ -d "usuarios_y_permisos_modo_oscuro" ] && mv "usuarios_y_permisos_modo_oscuro" "10_usuarios_y_permisos/gestion_de_usuarios_modo_oscuro"

echo "✔ 10_usuarios_y_permisos"

# ----------------------------------------------------------------
# 11 - ALERTAS INTELIGENTES
# Notificaciones automaticas por stock bajo, deudas, margenes, etc
# ----------------------------------------------------------------
mkdir -p "11_alertas_inteligentes/centro_de_alertas_modo_claro"
mkdir -p "11_alertas_inteligentes/centro_de_alertas_modo_oscuro"

[ -d "alertas_inteligentes_modo_claro"  ] && mv "alertas_inteligentes_modo_claro"  "11_alertas_inteligentes/centro_de_alertas_modo_claro"
[ -d "alertas_inteligentes_modo_oscuro" ] && mv "alertas_inteligentes_modo_oscuro" "11_alertas_inteligentes/centro_de_alertas_modo_oscuro"

echo "✔ 11_alertas_inteligentes"

# ----------------------------------------------------------------
# 12 - CONFIGURACION GENERAL
# El dueno configura la tasa, IVA, metodos de pago y datos del negocio
# ----------------------------------------------------------------
mkdir -p "12_configuracion_general/ajustes_del_sistema_modo_claro"
mkdir -p "12_configuracion_general/ajustes_del_sistema_modo_oscuro"

[ -d "configuraci_n_general_modo_claro"  ] && mv "configuraci_n_general_modo_claro"  "12_configuracion_general/ajustes_del_sistema_modo_claro"
[ -d "configuraci_n_general_modo_oscuro" ] && mv "configuraci_n_general_modo_oscuro" "12_configuracion_general/ajustes_del_sistema_modo_oscuro"

echo "✔ 12_configuracion_general"

# ================================================================
# RESUMEN FINAL
# ================================================================
echo ""
echo "================================================"
echo "  Reorganizacion completada"
echo "================================================"
echo ""

find . -maxdepth 2 -type d | sort | grep -v "^\.$" | sed 's|./||' | while read dir; do
  depth=$(echo "$dir" | tr -cd '/' | wc -c)
  if [ "$depth" -eq 0 ]; then
    echo "  📁 $dir"
  else
    echo "       └── 📂 $(basename "$dir")"
  fi
done

echo ""
echo "  Modulos organizados : 12"
echo "  Carpetas totales    : $(find . -type d | wc -l)"
echo "  Archivos totales    : $(find . -type f -not -name '*.sh' | wc -l)"
echo ""
echo "  Listo. Comparte la carpeta con tu equipo."
echo "================================================"
