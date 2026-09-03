/**
 * Sample data for the showcase.
 *
 * Deliberately domain-neutral: a small product catalogue. It exercises the
 * things the components need to prove — identifiers that must align, mixed
 * numeric and text sorting, grouped options and a realistic row count for
 * pagination — without tying the design system to any one consuming app.
 */

export type StockStatus = 'in-stock' | 'low' | 'backorder' | 'discontinued';

export interface CatalogueItem {
  readonly sku: string;
  readonly name: string;
  readonly category: string;
  readonly supplier: string;
  readonly stock: number;
  readonly unitPrice: number;
  readonly status: StockStatus;
  readonly updated: string;
}

export const CATEGORIES = [
  'Cabling',
  'Enclosures',
  'Fasteners',
  'Instruments',
  'Power',
  'Sensors',
] as const;

export const SUPPLIERS = [
  'Ardent Supply',
  'Brightwater',
  'Corvid Industrial',
  'Delta Components',
  'Everline',
] as const;

export const STATUS_LABELS: Record<StockStatus, string> = {
  'in-stock': 'In stock',
  low: 'Low',
  backorder: 'Backorder',
  discontinued: 'Discontinued',
};

export const CATALOGUE: readonly CatalogueItem[] = [
  { sku: 'CB-1042', name: 'Shielded twisted pair, 4-core', category: 'Cabling', supplier: 'Everline', stock: 1840, unitPrice: 2.35, status: 'in-stock', updated: '2026-08-28' },
  { sku: 'CB-1043', name: 'Shielded twisted pair, 8-core', category: 'Cabling', supplier: 'Everline', stock: 620, unitPrice: 4.1, status: 'in-stock', updated: '2026-08-28' },
  { sku: 'CB-2210', name: 'Braided sleeving, 12 mm', category: 'Cabling', supplier: 'Brightwater', stock: 74, unitPrice: 1.15, status: 'low', updated: '2026-08-19' },
  { sku: 'CB-2211', name: 'Braided sleeving, 20 mm', category: 'Cabling', supplier: 'Brightwater', stock: 0, unitPrice: 1.48, status: 'backorder', updated: '2026-08-11' },
  { sku: 'CB-3390', name: 'Cable gland, M20 brass', category: 'Cabling', supplier: 'Ardent Supply', stock: 2450, unitPrice: 0.92, status: 'in-stock', updated: '2026-09-01' },
  { sku: 'EN-0110', name: 'Wall enclosure, 400×300×150', category: 'Enclosures', supplier: 'Corvid Industrial', stock: 38, unitPrice: 84.0, status: 'low', updated: '2026-08-22' },
  { sku: 'EN-0112', name: 'Wall enclosure, 600×400×200', category: 'Enclosures', supplier: 'Corvid Industrial', stock: 12, unitPrice: 131.5, status: 'low', updated: '2026-08-22' },
  { sku: 'EN-0140', name: 'DIN rail, 35 mm × 1 m', category: 'Enclosures', supplier: 'Ardent Supply', stock: 960, unitPrice: 3.75, status: 'in-stock', updated: '2026-08-30' },
  { sku: 'EN-0155', name: 'Gland plate, 8-way', category: 'Enclosures', supplier: 'Corvid Industrial', stock: 0, unitPrice: 22.4, status: 'discontinued', updated: '2026-06-04' },
  { sku: 'EN-0203', name: 'Ventilation kit with filter', category: 'Enclosures', supplier: 'Delta Components', stock: 145, unitPrice: 17.9, status: 'in-stock', updated: '2026-08-15' },
  { sku: 'FS-4001', name: 'Hex bolt M8×40, A2', category: 'Fasteners', supplier: 'Ardent Supply', stock: 12400, unitPrice: 0.18, status: 'in-stock', updated: '2026-09-02' },
  { sku: 'FS-4002', name: 'Hex bolt M10×50, A2', category: 'Fasteners', supplier: 'Ardent Supply', stock: 8600, unitPrice: 0.29, status: 'in-stock', updated: '2026-09-02' },
  { sku: 'FS-4110', name: 'Nyloc nut M8, A4', category: 'Fasteners', supplier: 'Brightwater', stock: 5200, unitPrice: 0.11, status: 'in-stock', updated: '2026-08-26' },
  { sku: 'FS-4220', name: 'Spring washer M10', category: 'Fasteners', supplier: 'Brightwater', stock: 340, unitPrice: 0.06, status: 'low', updated: '2026-07-30' },
  { sku: 'FS-4390', name: 'Threaded rod M12 × 1 m', category: 'Fasteners', supplier: 'Delta Components', stock: 275, unitPrice: 6.4, status: 'in-stock', updated: '2026-08-18' },
  { sku: 'IN-7001', name: 'Digital caliper, 150 mm', category: 'Instruments', supplier: 'Delta Components', stock: 46, unitPrice: 58.0, status: 'in-stock', updated: '2026-08-27' },
  { sku: 'IN-7014', name: 'Torque wrench, 20–100 Nm', category: 'Instruments', supplier: 'Delta Components', stock: 9, unitPrice: 214.0, status: 'low', updated: '2026-08-09' },
  { sku: 'IN-7020', name: 'Insulation tester, 1 kV', category: 'Instruments', supplier: 'Corvid Industrial', stock: 4, unitPrice: 486.0, status: 'low', updated: '2026-07-21' },
  { sku: 'IN-7035', name: 'Infrared thermometer', category: 'Instruments', supplier: 'Everline', stock: 62, unitPrice: 74.5, status: 'in-stock', updated: '2026-08-31' },
  { sku: 'IN-7042', name: 'Clamp meter, 600 A', category: 'Instruments', supplier: 'Everline', stock: 0, unitPrice: 128.0, status: 'backorder', updated: '2026-08-05' },
  { sku: 'PW-5010', name: 'DIN power supply, 24 V 5 A', category: 'Power', supplier: 'Corvid Industrial', stock: 128, unitPrice: 96.0, status: 'in-stock', updated: '2026-08-29' },
  { sku: 'PW-5011', name: 'DIN power supply, 24 V 10 A', category: 'Power', supplier: 'Corvid Industrial', stock: 54, unitPrice: 142.0, status: 'in-stock', updated: '2026-08-29' },
  { sku: 'PW-5120', name: 'Miniature circuit breaker, C16', category: 'Power', supplier: 'Ardent Supply', stock: 780, unitPrice: 7.85, status: 'in-stock', updated: '2026-09-01' },
  { sku: 'PW-5121', name: 'Miniature circuit breaker, C32', category: 'Power', supplier: 'Ardent Supply', stock: 410, unitPrice: 9.2, status: 'in-stock', updated: '2026-09-01' },
  { sku: 'PW-5240', name: 'Surge protection module, Type 2', category: 'Power', supplier: 'Brightwater', stock: 22, unitPrice: 63.0, status: 'low', updated: '2026-08-13' },
  { sku: 'PW-5310', name: 'Terminal block, 4 mm² grey', category: 'Power', supplier: 'Delta Components', stock: 3400, unitPrice: 0.74, status: 'in-stock', updated: '2026-08-24' },
  { sku: 'PW-5311', name: 'Terminal block, 6 mm² blue', category: 'Power', supplier: 'Delta Components', stock: 1250, unitPrice: 0.96, status: 'in-stock', updated: '2026-08-24' },
  { sku: 'SN-8100', name: 'Inductive proximity sensor, M18', category: 'Sensors', supplier: 'Everline', stock: 210, unitPrice: 31.5, status: 'in-stock', updated: '2026-08-30' },
  { sku: 'SN-8101', name: 'Inductive proximity sensor, M30', category: 'Sensors', supplier: 'Everline', stock: 96, unitPrice: 44.0, status: 'in-stock', updated: '2026-08-30' },
  { sku: 'SN-8215', name: 'Pressure transmitter, 0–10 bar', category: 'Sensors', supplier: 'Corvid Industrial', stock: 17, unitPrice: 268.0, status: 'low', updated: '2026-08-07' },
  { sku: 'SN-8216', name: 'Pressure transmitter, 0–25 bar', category: 'Sensors', supplier: 'Corvid Industrial', stock: 0, unitPrice: 291.0, status: 'backorder', updated: '2026-07-28' },
  { sku: 'SN-8330', name: 'Thermocouple type K, 100 mm', category: 'Sensors', supplier: 'Ardent Supply', stock: 640, unitPrice: 12.8, status: 'in-stock', updated: '2026-08-25' },
  { sku: 'SN-8331', name: 'Thermocouple type K, 250 mm', category: 'Sensors', supplier: 'Ardent Supply', stock: 385, unitPrice: 15.6, status: 'in-stock', updated: '2026-08-25' },
  { sku: 'SN-8402', name: 'Ultrasonic level sensor', category: 'Sensors', supplier: 'Brightwater', stock: 8, unitPrice: 352.0, status: 'low', updated: '2026-08-02' },
  { sku: 'SN-8510', name: 'Vibration sensor, 4–20 mA', category: 'Sensors', supplier: 'Delta Components', stock: 0, unitPrice: 410.0, status: 'discontinued', updated: '2026-05-19' },
  { sku: 'CB-3391', name: 'Cable gland, M25 brass', category: 'Cabling', supplier: 'Ardent Supply', stock: 1680, unitPrice: 1.24, status: 'in-stock', updated: '2026-09-01' },
  { sku: 'EN-0210', name: 'Ventilation kit, high flow', category: 'Enclosures', supplier: 'Delta Components', stock: 61, unitPrice: 26.5, status: 'in-stock', updated: '2026-08-15' },
  { sku: 'FS-4400', name: 'Anchor bolt M16 × 120', category: 'Fasteners', supplier: 'Corvid Industrial', stock: 190, unitPrice: 3.05, status: 'in-stock', updated: '2026-08-20' },
  { sku: 'IN-7050', name: 'Bore gauge set, 18–35 mm', category: 'Instruments', supplier: 'Brightwater', stock: 3, unitPrice: 640.0, status: 'low', updated: '2026-07-14' },
  { sku: 'PW-5330', name: 'Terminal block, 10 mm² earth', category: 'Power', supplier: 'Delta Components', stock: 870, unitPrice: 1.42, status: 'in-stock', updated: '2026-08-24' },
];
