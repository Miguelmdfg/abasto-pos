// ─── Productos reales del abasto venezolano ───────────────────────────────────
// Precios en Bs (tasa referencial ~36 Bs/USD)

export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;  // Bs
  costo: number;  // Bs
  stock: number;
};

export const MOCK_PRODUCTS: Product[] = [
  // ── Abarrotes / Granos ──
  { id: 101, name: 'Arroz Mary Superior 1kg',     category: 'Granos',        price: 135, costo: 95,  stock: 80 },
  { id: 102, name: 'Arroz Amanecer 900g',          category: 'Granos',        price: 130, costo: 90,  stock: 65 },
  { id: 103, name: 'Azúcar 1kg',                   category: 'Granos',        price: 105, costo: 72,  stock: 50 },
  { id: 104, name: 'Azúcar Maite 900g',            category: 'Granos',        price: 95,  costo: 65,  stock: 40 },
  { id: 105, name: 'Harina PAN 1kg',               category: 'Granos',        price: 120, costo: 82,  stock: 90 },
  { id: 106, name: 'Caraotas Negras 500g',         category: 'Granos',        price: 85,  costo: 58,  stock: 35 },
  { id: 107, name: 'Lentejas 500g',                category: 'Granos',        price: 80,  costo: 55,  stock: 30 },
  { id: 108, name: 'Pasta Capri 500g',             category: 'Pastas',        price: 75,  costo: 50,  stock: 70 },
  { id: 109, name: 'Pasta Tuinky 500g',            category: 'Pastas',        price: 70,  costo: 48,  stock: 60 },
  { id: 110, name: 'Avena Pantera 400g',           category: 'Granos',        price: 80,  costo: 55,  stock: 45 },

  // ── Aceites y Condimentos ──
  { id: 201, name: 'Aceite Vatel 1L',              category: 'Aceites',       price: 185, costo: 130, stock: 55 },
  { id: 202, name: 'Aceite Mazeite 900ml',         category: 'Aceites',       price: 175, costo: 120, stock: 40 },
  { id: 203, name: 'Sal Granelera 500g',           category: 'Condimentos',   price: 30,  costo: 18,  stock: 80 },
  { id: 204, name: 'Salsa de Tomate Heinz',        category: 'Condimentos',   price: 95,  costo: 65,  stock: 35 },
  { id: 205, name: 'Mayonesa Kraft 445g',          category: 'Condimentos',   price: 145, costo: 100, stock: 28 },
  { id: 206, name: 'Mostaza Heinz 340g',           category: 'Condimentos',   price: 85,  costo: 58,  stock: 22 },
  { id: 207, name: 'Atún Marina 170gr',            category: 'Enlatados',     price: 100, costo: 68,  stock: 60 },
  { id: 208, name: 'Sardinas Tuny 170g',           category: 'Enlatados',     price: 90,  costo: 62,  stock: 50 },

  // ── Bebidas ──
  { id: 301, name: 'Bebida Agua Mineral 1.5lts',   category: 'Bebidas',       price: 30,  costo: 18,  stock: 120 },
  { id: 302, name: 'Bebida Agua Mineral 600ml',    category: 'Bebidas',       price: 18,  costo: 10,  stock: 100 },
  { id: 303, name: 'Bebida Gatorade 600ml',        category: 'Bebidas',       price: 90,  costo: 62,  stock: 48 },
  { id: 304, name: 'Bebida Powerade 600ml',        category: 'Bebidas',       price: 93,  costo: 65,  stock: 42 },
  { id: 305, name: 'Bebida Speed Lata 250ml',      category: 'Bebidas',       price: 45,  costo: 30,  stock: 36 },
  { id: 306, name: 'Bebida Speed Botellota Litro', category: 'Bebidas',       price: 50,  costo: 33,  stock: 30 },
  { id: 307, name: 'Bebida Malta 1.5lts',          category: 'Bebidas',       price: 150, costo: 105, stock: 25 },
  { id: 308, name: 'Bebida Malta Desechable',      category: 'Bebidas',       price: 60,  costo: 40,  stock: 55 },
  { id: 309, name: 'Bebida Malta Retornable',      category: 'Bebidas',       price: 40,  costo: 25,  stock: 30 },
  { id: 310, name: 'Bebida Jugo Del Valle 1.5lts', category: 'Bebidas',       price: 80,  costo: 55,  stock: 38 },
  { id: 311, name: 'Bebida Jugo Del Valle 400ml',  category: 'Bebidas',       price: 30,  costo: 18,  stock: 65 },
  { id: 312, name: 'Bebida Jugitos Cartón 200ml',  category: 'Bebidas',       price: 30,  costo: 18,  stock: 80 },
  { id: 313, name: 'Bebida Jugitos Cartón 250ml',  category: 'Bebidas',       price: 30,  costo: 18,  stock: 75 },
  { id: 314, name: 'Bebida Justy 1.5lts',          category: 'Bebidas',       price: 80,  costo: 55,  stock: 32 },
  { id: 315, name: 'Bebida Cerveza Zulia',         category: 'Bebidas',       price: 95,  costo: 65,  stock: 72 },
  { id: 316, name: 'Bebida Energizante Black Bruin',category: 'Bebidas',      price: 55,  costo: 36,  stock: 44 },
  { id: 317, name: 'Refresco Polar Naranja 400ml', category: 'Bebidas',       price: 35,  costo: 22,  stock: 90 },
  { id: 318, name: 'Refresco Polar Uva 400ml',     category: 'Bebidas',       price: 35,  costo: 22,  stock: 85 },
  { id: 319, name: 'Bebida Spartan Energy',        category: 'Bebidas',       price: 75,  costo: 50,  stock: 28 },
  { id: 320, name: 'Bebida Té Canaima Limón',      category: 'Bebidas',       price: 45,  costo: 30,  stock: 40 },
  { id: 321, name: 'Leche Completa 1L',            category: 'Lácteos',       price: 120, costo: 82,  stock: 60 },
  { id: 322, name: 'Bebida Leche Completa 200ml',  category: 'Lácteos',       price: 50,  costo: 33,  stock: 55 },

  // ── Galletas y Snacks ──
  { id: 401, name: 'Galletas Club Social',         category: 'Galletas',      price: 105, costo: 72,  stock: 55 },
  { id: 402, name: 'Galletas Club Social Detallada',category: 'Galletas',     price: 20,  costo: 12,  stock: 120 },
  { id: 403, name: 'Galletas Crack',               category: 'Galletas',      price: 17,  costo: 10,  stock: 100 },
  { id: 404, name: 'Galletas Diani',               category: 'Galletas',      price: 6,   costo: 3,   stock: 150 },
  { id: 405, name: 'Galletas Tío-Top',             category: 'Galletas',      price: 50,  costo: 33,  stock: 60 },
  { id: 406, name: 'Galletas María Caledonia',     category: 'Galletas',      price: 65,  costo: 44,  stock: 45 },
  { id: 407, name: 'Galletas Charmy Tubo',         category: 'Galletas',      price: 80,  costo: 55,  stock: 38 },
  { id: 408, name: 'Galletas Charmy Unidad',       category: 'Galletas',      price: 15,  costo: 8,   stock: 90 },
  { id: 409, name: 'Galletas Rancheros',           category: 'Galletas',      price: 30,  costo: 18,  stock: 70 },
  { id: 410, name: 'Galletas Sáltimas/Noel 5',     category: 'Galletas',      price: 125, costo: 86,  stock: 35 },
  { id: 411, name: 'Galletas Sáltimas 7',          category: 'Galletas',      price: 180, costo: 126, stock: 22 },
  { id: 412, name: 'Galletas Sáltimas Detallada',  category: 'Galletas',      price: 30,  costo: 18,  stock: 80 },
  { id: 413, name: 'Galletas Yupi Tubo Surtidas',  category: 'Galletas',      price: 40,  costo: 26,  stock: 50 },
  { id: 414, name: 'Galletas Soda Puig',           category: 'Galletas',      price: 105, costo: 72,  stock: 40 },
  { id: 415, name: 'Galletas Soda Puig Detallada', category: 'Galletas',      price: 20,  costo: 12,  stock: 95 },
  { id: 416, name: 'Doritos Grande',               category: 'Snacks',        price: 185, costo: 130, stock: 30 },
  { id: 417, name: 'Doritos Mediano',              category: 'Snacks',        price: 100, costo: 68,  stock: 45 },
  { id: 418, name: 'Platanitos Bolsa',             category: 'Snacks',        price: 50,  costo: 33,  stock: 60 },
  { id: 419, name: 'Golpe Pequeño',               category: 'Snacks',        price: 40,  costo: 26,  stock: 55 },
  { id: 420, name: 'Golpe Grande',                category: 'Snacks',        price: 185, costo: 130, stock: 20 },

  // ── Higiene Personal ──
  { id: 501, name: 'Afeitadora Maturbe',           category: 'Higiene',       price: 30,  costo: 18,  stock: 40 },
  { id: 502, name: 'Alcohol Antiséptico 120ml',    category: 'Higiene',       price: 95,  costo: 65,  stock: 35 },
  { id: 503, name: 'Aromax Repelente',             category: 'Higiene',       price: 42,  costo: 28,  stock: 25 },
  { id: 504, name: 'Acondicionador Alive 391ml',   category: 'Higiene',       price: 0,   costo: 0,   stock: 0  },
  { id: 505, name: 'Jabón de Baño Palmolive',      category: 'Higiene',       price: 45,  costo: 30,  stock: 50 },
  { id: 506, name: 'Shampoo Head & Shoulders',     category: 'Higiene',       price: 195, costo: 135, stock: 20 },
  { id: 507, name: 'Pasta Dental Colgate 75ml',    category: 'Higiene',       price: 85,  costo: 58,  stock: 35 },
  { id: 508, name: 'Cepillo Dental Oral-B',        category: 'Higiene',       price: 65,  costo: 44,  stock: 28 },
  { id: 509, name: 'Desodorante Axe 150ml',        category: 'Higiene',       price: 150, costo: 105, stock: 22 },
  { id: 510, name: 'Papel Higiénico Rosal x4',     category: 'Higiene',       price: 120, costo: 82,  stock: 45 },

  // ── Limpieza del Hogar ──
  { id: 601, name: 'Abodo La Comadre 200g',        category: 'Limpieza',      price: 100, costo: 68,  stock: 60 },
  { id: 602, name: 'Cloro Clorox 1L',              category: 'Limpieza',      price: 85,  costo: 58,  stock: 40 },
  { id: 603, name: 'Detergente Ariel 500g',        category: 'Limpieza',      price: 165, costo: 115, stock: 30 },
  { id: 604, name: 'Detergente Fab 500g',          category: 'Limpieza',      price: 120, costo: 82,  stock: 35 },
  { id: 605, name: 'Suavizante Downy 500ml',       category: 'Limpieza',      price: 135, costo: 93,  stock: 22 },
  { id: 606, name: 'Esponja Brillo',               category: 'Limpieza',      price: 35,  costo: 22,  stock: 55 },
  { id: 607, name: 'Esponja Doble Uso',            category: 'Limpieza',      price: 20,  costo: 12,  stock: 70 },
  { id: 608, name: 'Esponja Jabonosa',             category: 'Limpieza',      price: 60,  costo: 40,  stock: 40 },
  { id: 609, name: 'Bolsas de Basura x10',         category: 'Limpieza',      price: 45,  costo: 30,  stock: 50 },
  { id: 610, name: 'Desinfectante Pinesol 500ml',  category: 'Limpieza',      price: 110, costo: 75,  stock: 28 },

  // ── Lácteos y Frescos ──
  { id: 701, name: 'Queso Mano 250g',              category: 'Lácteos',       price: 145, costo: 100, stock: 20 },
  { id: 702, name: 'Queso Blanco Duro 250g',       category: 'Lácteos',       price: 130, costo: 88,  stock: 18 },
  { id: 703, name: 'Margarina Mavesa 500g',        category: 'Lácteos',       price: 120, costo: 82,  stock: 30 },
  { id: 704, name: 'Huevos Cartón x30',            category: 'Lácteos',       price: 320, costo: 225, stock: 15 },
  { id: 705, name: 'Huevos Cartón x6',             category: 'Lácteos',       price: 70,  costo: 48,  stock: 40 },

  // ── Dulces y Golosinas ──
  { id: 801, name: 'Gelatina Vasito',              category: 'Dulces',        price: 45,  costo: 30,  stock: 60 },
  { id: 802, name: 'Gelatina Frutilla',            category: 'Dulces',        price: 45,  costo: 30,  stock: 55 },
  { id: 803, name: 'Gelatina Sonrisa',             category: 'Dulces',        price: 75,  costo: 50,  stock: 40 },
  { id: 804, name: 'Gomitas Trululu Bianchi Paq',  category: 'Dulces',        price: 50,  costo: 33,  stock: 70 },
  { id: 805, name: 'Gomitas Comida',               category: 'Dulces',        price: 50,  costo: 33,  stock: 65 },
  { id: 806, name: 'Gomitas Marshmellows',         category: 'Dulces',        price: 5,   costo: 2,   stock: 200 },
  { id: 807, name: 'Gomitas Sobre Play 50g',       category: 'Dulces',        price: 40,  costo: 26,  stock: 80 },
  { id: 808, name: 'Flaquito',                     category: 'Dulces',        price: 40,  costo: 26,  stock: 90 },
  { id: 809, name: 'Chocolate Savoy 45g',          category: 'Dulces',        price: 65,  costo: 44,  stock: 45 },
  { id: 810, name: 'Chicle Tumix Bolsa',           category: 'Dulces',        price: 35,  costo: 22,  stock: 100 },

  // ── Papelería / Misceláneos ──
  { id: 901, name: 'Papel Bond A4 x100',           category: 'Papelería',     price: 85,  costo: 58,  stock: 20 },
  { id: 902, name: 'Bolígrafo BIC Unidad',         category: 'Papelería',     price: 15,  costo: 8,   stock: 80 },
  { id: 903, name: 'Cuaderno Norma 100 Hojas',     category: 'Papelería',     price: 95,  costo: 65,  stock: 25 },
  { id: 904, name: 'Pilas AA Duracell x2',         category: 'Papelería',     price: 80,  costo: 55,  stock: 30 },
  { id: 905, name: 'Encendedor Bic',               category: 'Papelería',     price: 25,  costo: 15,  stock: 50 },
];
