import { hash } from 'bcryptjs';
import type { Table, Row } from '../shared/types.js';
export const tables: Table[] = [
  'users',
  'categories',
  'products',
  'lots',
  'movements',
  'suppliers',
  'customers',
  'purchases',
  'purchaseItems',
  'sales',
  'saleItems',
  'orders',
  'orderItems',
  'renewals',
  'auditLogs',
  'settings',
  'sessions',
];
export async function seedData(): Promise<Record<Table, Row[]>> {
  const data = Object.fromEntries(tables.map((t) => [t, []])) as unknown as Record<Table, Row[]>;
  data.users = [
    {
      id: 'admin',
      name: 'Luis Dionicio',
      email: 'admin@ferremax.pe',
      passwordHash: await hash(process.env.DEMO_ADMIN_PASSWORD || 'FerreMax2026!', 12),
      role: 'ADMIN',
      active: true,
    },
    {
      id: 'employee',
      name: 'María Torres',
      email: 'empleado@ferremax.pe',
      passwordHash: await hash(process.env.DEMO_EMPLOYEE_PASSWORD || 'Empleado2026!', 12),
      role: 'EMPLOYEE',
      active: true,
    },
  ];
  data.categories = [
    'Herramientas',
    'Pinturas',
    'Electricidad',
    'Gasfitería',
    'Construcción',
    'Seguridad',
  ].map((name, i) => ({ id: `cat-${i + 1}`, name, active: true }));
  data.suppliers = [
    {
      id: 'sup-1',
      name: 'Distribuidora del Pacífico',
      ruc: '20123456789',
      contact: 'Ana Medina',
      phone: '999 222 333',
      email: 'ventas@distribuidorademo.pe',
      active: true,
    },
    {
      id: 'sup-2',
      name: 'Suministros Andinos',
      ruc: '20987654321',
      contact: 'Carlos Rojas',
      phone: '988 111 222',
      email: 'pedidos@suministrosdemo.pe',
      active: true,
    },
    {
      id: 'sup-3',
      name: 'Acabados y Construcción Lima',
      ruc: '20444555667',
      contact: 'Rocío Salazar',
      phone: '955 830 420',
      email: 'compras@acabadosdemo.pe',
      active: true,
    },
  ];
  data.customers = [
    {
      id: 'cli-1',
      name: 'Constructora Horizonte',
      document: '20555111222',
      email: 'compras@example.com',
      phone: '977 555 444',
      active: true,
    },
    {
      id: 'cli-2',
      name: 'Jorge Mendoza',
      document: '70123456',
      email: 'jorge@example.com',
      phone: '966 444 333',
      active: true,
    },
  ];
  const source = [
    [
      'Taladro percutor Bosch GSB 185-LI 18V',
      'Bosch',
      1,
      47990,
      12,
      5,
      'drill-bosch',
      'Equipo inalámbrico con batería, cargador, maletín y accesorios para perforación y atornillado.',
    ],
    [
      'Pintura látex satinada blanca 1 galón',
      'Vencedor',
      2,
      8490,
      24,
      8,
      'paint-vencedor',
      'Pintura lavable para interior y exterior, rendimiento referencial de 30 m² por capa.',
    ],
    [
      'Set de herramientas mecánicas 120 piezas',
      'Stanley',
      1,
      52990,
      8,
      4,
      'tools-stanley',
      'Maletín completo con dados, llaves y ratchets para taller y mantenimiento.',
    ],
    [
      'Cable NH-90 2.5 mm² x 100 m',
      'Indeco',
      3,
      26900,
      18,
      5,
      'cable-indeco',
      'Conductor libre de halógenos para instalaciones fijas de 450/750 V.',
    ],
    [
      'Llave para lavatorio al mueble',
      'Vainsa',
      4,
      50990,
      3,
      5,
      'faucet-vainsa',
      'Grifería cromada de bronce con cierre cerámico de un cuarto de giro.',
    ],
    [
      'Cemento Portland tipo I 42.5 kg',
      'Sol',
      5,
      3090,
      80,
      20,
      'cement-sol',
      'Bolsa para obras de concreto, albañilería y trabajos generales de construcción.',
    ],
    [
      'Casco dieléctrico Mountain',
      'Steelpro',
      6,
      3990,
      30,
      10,
      'helmet-steelpro',
      'Protección industrial con suspensión ajustable para trabajos de obra y mantenimiento.',
    ],
    [
      'Amoladora angular GWS 850 4½ pulgadas',
      'Bosch',
      1,
      23990,
      6,
      4,
      'grinder-bosch',
      'Herramienta compacta de 850 W con maletín y discos para corte y desbaste.',
    ],
    [
      'Sellador acrílico Sikacryl 200 300 ml',
      'Sika',
      2,
      3290,
      5,
      8,
      'sealant-sika',
      'Cartucho pintable para sellar juntas y fisuras interiores o exteriores protegidos.',
    ],
    [
      'Interruptor termomagnético bipolar 15 A',
      'Schneider Electric',
      3,
      4590,
      40,
      10,
      'breaker-schneider',
      'Protección bipolar referencial para tableros eléctricos; instalación por personal calificado.',
    ],
    [
      'Tubo PVC para agua fría ½ pulgada x 5 m',
      'Pavco',
      4,
      1200,
      50,
      15,
      'pipe-pavco',
      'Tubería para redes de agua fría, ligera y resistente a la corrosión.',
    ],
    [
      'Guantes de nitrilo con puño tejido',
      'Steelpro',
      6,
      1600,
      2,
      10,
      'gloves-steelpro',
      'Par de guantes con recubrimiento de nitrilo y agarre para trabajo industrial.',
    ],
  ] as const;
  source.forEach((v, i) => {
    const [name, brand, category, price, quantity, minStock, image, description] = v;
    const id = `prod-${i + 1}`;
    data.products.push({
      id,
      sku: `FM-${String(i + 1).padStart(4, '0')}`,
      slug: `producto-${i + 1}`,
      name,
      brand,
      categoryId: `cat-${category}`,
      price,
      minStock,
      unit: category === 5 ? 'bolsa' : 'unidad',
      image: `/images/reference/${image}.jpg`,
      description: `${description} Imagen y datos referenciales para demostración; confirma la ficha técnica antes de comprar.`,
      active: true,
      featured: i < 8,
    });
    const expiresAt = i === 1 ? '2026-11-18' : i === 8 ? '2026-10-28' : null;
    data.lots.push({
      id: `lot-${i + 1}`,
      productId: id,
      code: `L-2026-${String(i + 1).padStart(3, '0')}`,
      quantity,
      cost: Math.round(Number(price) * 0.65),
      expiresAt,
    });
    data.movements.push({
      id: `mov-${i + 1}`,
      productId: id,
      lotId: `lot-${i + 1}`,
      type: 'ENTRADA',
      quantity,
      reason: 'Inventario inicial de demostración',
      reference: 'SEED',
      userId: 'admin',
      createdAt: new Date().toISOString(),
    });
  });

  // Compras históricas de demostración para relacionar proveedores, costos, lotes y vencimientos.
  data.purchases = [
    {
      id: 'FMC-2026-001',
      supplierId: 'sup-1',
      userId: 'admin',
      status: 'RECIBIDA',
      total: 125180,
      createdAt: '2026-09-18T15:30:00.000Z',
    },
    {
      id: 'FMC-2026-002',
      supplierId: 'sup-2',
      userId: 'admin',
      status: 'RECIBIDA',
      total: 67340,
      createdAt: '2026-09-26T17:10:00.000Z',
    },
    {
      id: 'FMC-2026-003',
      supplierId: 'sup-3',
      userId: 'admin',
      status: 'PENDIENTE',
      total: 39260,
      createdAt: '2026-10-03T14:45:00.000Z',
    },
  ];
  data.purchaseItems = [
    {
      id: 'fmc-item-1',
      purchaseId: 'FMC-2026-001',
      productId: 'prod-2',
      quantity: 12,
      cost: 5480,
      expiresAt: '2026-11-18',
    },
    {
      id: 'fmc-item-2',
      purchaseId: 'FMC-2026-001',
      productId: 'prod-4',
      quantity: 2,
      cost: 21900,
      expiresAt: null,
    },
    {
      id: 'fmc-item-3',
      purchaseId: 'FMC-2026-001',
      productId: 'prod-6',
      quantity: 10,
      cost: 1574,
      expiresAt: null,
    },
    {
      id: 'fmc-item-4',
      purchaseId: 'FMC-2026-002',
      productId: 'prod-1',
      quantity: 1,
      cost: 31190,
      expiresAt: null,
    },
    {
      id: 'fmc-item-5',
      purchaseId: 'FMC-2026-002',
      productId: 'prod-9',
      quantity: 10,
      cost: 2135,
      expiresAt: '2026-10-28',
    },
    {
      id: 'fmc-item-6',
      purchaseId: 'FMC-2026-002',
      productId: 'prod-12',
      quantity: 10,
      cost: 1480,
      expiresAt: null,
    },
    {
      id: 'fmc-item-7',
      purchaseId: 'FMC-2026-003',
      productId: 'prod-7',
      quantity: 8,
      cost: 2590,
      expiresAt: null,
    },
    {
      id: 'fmc-item-8',
      purchaseId: 'FMC-2026-003',
      productId: 'prod-11',
      quantity: 20,
      cost: 927,
      expiresAt: null,
    },
  ];

  // Historial ficticio coherente: cada venta de demo descuenta de su lote.
  const demoSales = [
    ['prod-1', 1],
    ['prod-6', 3],
    ['prod-7', 2],
    ['prod-2', 2],
    ['prod-3', 1],
    ['prod-4', 1],
    ['prod-10', 4],
  ] as const;
  demoSales.forEach(([productId, quantity], i) => {
    const product = data.products.find((p) => p.id === productId)!;
    const lot = data.lots.find((l) => l.productId === productId)!;
    const id = `FMV${String(i + 1).padStart(5, '0')}-demo`;
    const createdAt = new Date(Date.now() - (6 - i) * 86400000).toISOString();
    lot.quantity -= quantity;
    data.sales.push({
      id,
      customerId: i % 2 === 0 ? 'cli-1' : null,
      orderId: null,
      userId: 'admin',
      status: 'CONFIRMADA',
      total: product.price * quantity,
      payment: i % 2 === 0 ? 'YAPE' : 'EFECTIVO',
      createdAt,
    });
    data.saleItems.push({
      id: `demo-item-${i + 1}`,
      saleId: id,
      productId,
      quantity,
      price: product.price,
    });
    data.movements.push({
      id: `demo-salida-${i + 1}`,
      productId,
      lotId: lot.id,
      type: 'SALIDA',
      quantity: -quantity,
      reason: 'Venta ficticia de demostración',
      reference: id,
      userId: 'admin',
      createdAt,
    });
  });
  data.renewals = [
    {
      id: 'ren-1',
      name: 'Mantenimiento de extintores',
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      responsible: 'Luis Dionicio',
      status: 'PENDIENTE',
      notes: 'Coordinar visita del proveedor',
    },
    {
      id: 'ren-2',
      name: 'Renovación del dominio web',
      dueDate: new Date(Date.now() + 35 * 86400000).toISOString().slice(0, 10),
      responsible: 'Luis Dionicio',
      status: 'PENDIENTE',
      notes: 'Revisar cuenta de hosting',
    },
  ];
  data.settings = [
    {
      id: 'store',
      name: 'FerreMax',
      phone: '999123456',
      address: 'Av. Los Constructores 1240, Lima',
      email: 'hola@ferremax.pe',
      currency: 'PEN',
    },
  ];
  return data;
}
