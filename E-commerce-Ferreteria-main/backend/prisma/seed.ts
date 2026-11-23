import 'dotenv/config';
import {PrismaClient} from '@prisma/client';
import {seedData} from '../src/config/seed-data.js';
const db=new PrismaClient();
try {if(await db.user.count())throw new Error('La base ya contiene usuarios. No se sobrescribirá.');const data=await seedData();await db.$transaction(async tx=>{for(const [table,model] of [['users','user'],['categories','category'],['suppliers','supplier'],['customers','customer'],['products','product'],['lots','inventoryLot'],['movements','inventoryMovement'],['purchases','purchase'],['purchaseItems','purchaseItem'],['renewals','renewal'],['settings','setting']] as const)for(const row of data[table])await (tx as any)[model].create({data:row});},{timeout:30000});console.log('Datos de demostración creados. Cambia las contraseñas antes de publicar.');} finally {await db.$disconnect();}
