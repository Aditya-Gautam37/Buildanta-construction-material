import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export type RequestWithId = Request & { requestId: string; startedAt: number };

// Reuse a caller-supplied ID (e.g. from a frontend that already generated one
// for its own logs) so the same request can be traced across both sides;
// otherwise mint one. Either way it's echoed back so the client can report it.
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers['x-request-id'];
  const requestId = (typeof incoming === 'string' && incoming.trim()) || randomUUID();
  (req as RequestWithId).requestId = requestId;
  (req as RequestWithId).startedAt = Date.now();
  res.setHeader('x-request-id', requestId);
  next();
}
