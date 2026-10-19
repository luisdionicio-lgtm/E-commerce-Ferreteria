import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Repository, Unit, Table, Row } from '../shared/types.js';
import { tables, seedData } from './seed-data.js';
import { AppError } from '../shared/errors.js';
import { env } from './env.js';
import type { Prisma } from '@prisma/client';
type Data = Record<Table, Row[]>;
class JsonUnit implements Unit {
  constructor(private data: Data) {}
  async all(t: Table) {
    return this.data[t];
  }
  async get(t: Table, id: string) {
    return this.data[t].find((r) => r.id === id);
  }
  async create(t: Table, row: Row) {
    this.data[t].push(row);
    return row;
  }
  async update(t: Table, id: string, patch: Record<string, any>) {
    const row = await this.get(t, id);
    if (!row) throw new AppError(404, 'Registro no encontrado');
    Object.assign(row, patch);
    return row;
  }
  async remove(t: Table, id: string) {
    this.data[t] = this.data[t].filter((r) => r.id !== id);
  }
}
export class JsonRepository implements Repository {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(
    private data: Data,
    private path?: string,
  ) {}
  static async open(path: string) {
    let data: Data;
    try {
      data = JSON.parse(await readFile(path, 'utf8'));
    } catch (e: any) {
      if (e.code !== 'ENOENT') throw e;
      data = await seedData();
      await mkdir(resolve(path, '..'), { recursive: true });
      await writeFile(path, JSON.stringify(data, null, 2));
    }
    return new JsonRepository(data, path);
  }
  async read<T>(fn: (u: Unit) => Promise<T>) {
    await this.queue;
    return fn(new JsonUnit(structuredClone(this.data)));
  }
  transaction<T>(fn: (u: Unit) => Promise<T>): Promise<T> {
    const task = this.queue.then(async () => {
      const copy = structuredClone(this.data);
      const result = await fn(new JsonUnit(copy));
      if (this.path) {
        const tmp = this.path + '.' + randomUUID() + '.tmp';
        await writeFile(tmp, JSON.stringify(copy, null, 2));
        await rename(tmp, this.path);
      }
      this.data = copy;
      return structuredClone(result);
    });
    this.queue = task.catch(() => {});
    return task;
  }
}
const model: Record<Table, string> = {
  users: 'user',
  categories: 'category',
  products: 'product',
  lots: 'inventoryLot',
  movements: 'inventoryMovement',
  suppliers: 'supplier',
  customers: 'customer',
  purchases: 'purchase',
  purchaseItems: 'purchaseItem',
  sales: 'sale',
  saleItems: 'saleItem',
  orders: 'order',
  orderItems: 'orderItem',
  renewals: 'renewal',
  auditLogs: 'auditLog',
  settings: 'setting',
  sessions: 'session',
};
class PrismaUnit implements Unit {
  constructor(private db: any) {}
  all(t: Table) {
    return this.db[model[t]].findMany();
  }
  async get(t: Table, id: string) {
    return (await this.db[model[t]].findUnique({ where: { id } })) || undefined;
  }
  create(t: Table, row: Row) {
    return this.db[model[t]].create({ data: row });
  }
  update(t: Table, id: string, data: Record<string, any>) {
    return this.db[model[t]].update({ where: { id }, data });
  }
  async remove(t: Table, id: string) {
    await this.db[model[t]].delete({ where: { id } });
  }
}
export async function createRepository(): Promise<Repository> {
  if (env.driver === 'json') return JsonRepository.open(resolve('data', 'store.json'));
  const { PrismaClient } = await import('@prisma/client');
  const db = new PrismaClient();
  await db.$connect();
  return {
    read: (fn) => fn(new PrismaUnit(db)),
    transaction: async (fn) => {
      for (let i = 0; i < 3; i++) {
        try {
          return await db.$transaction((tx: Prisma.TransactionClient) => fn(new PrismaUnit(tx)), {
            isolationLevel: 'Serializable',
            maxWait: 5000,
            timeout: 15000,
          });
        } catch (e: any) {
          if (e.code !== 'P2034' || i === 2) throw e;
        }
      }
      throw new Error('Transacción no completada');
    },
  };
}
