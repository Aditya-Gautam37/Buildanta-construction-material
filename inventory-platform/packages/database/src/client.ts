import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from './../generated/client';

const globalForPrisma = global as unknown as {
	prisma?: PrismaClient;
	pool?: Pool;
};

function createPrismaClient() {
	const connectionString = process.env.DATABASE_URL;

	if (!connectionString) {
		throw new Error('DATABASE_URL environment variable is required for Prisma');
	}

	const pool = globalForPrisma.pool ?? new Pool({ connectionString });
	const adapter = new PrismaPg(pool);

	if (process.env.NODE_ENV !== 'production') {
		globalForPrisma.pool = pool;
	}

	return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
	globalForPrisma.prisma = prisma;
}


