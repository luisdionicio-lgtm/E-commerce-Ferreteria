export type Table =
  | 'users'
  | 'categories'
  | 'products'
  | 'lots'
  | 'movements'
  | 'suppliers'
  | 'customers'
  | 'purchases'
  | 'purchaseItems'
  | 'sales'
  | 'saleItems'
  | 'orders'
  | 'orderItems'
  | 'renewals'
  | 'auditLogs'
  | 'settings'
  | 'sessions';
export type Row = Record<string, any> & { id: string };
export interface Unit {
  all(table: Table): Promise<Row[]>;
  get(table: Table, id: string): Promise<Row | undefined>;
  create(table: Table, row: Row): Promise<Row>;
  update(table: Table, id: string, data: Record<string, any>): Promise<Row>;
  remove(table: Table, id: string): Promise<void>;
}
export interface Repository {
  read<T>(fn: (unit: Unit) => Promise<T>): Promise<T>;
  transaction<T>(fn: (unit: Unit) => Promise<T>): Promise<T>;
}
