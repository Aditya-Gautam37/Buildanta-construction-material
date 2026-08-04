import { initTRPC } from '@trpc/server';

export const t = initTRPC.create();

export const NEST_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:5173';
