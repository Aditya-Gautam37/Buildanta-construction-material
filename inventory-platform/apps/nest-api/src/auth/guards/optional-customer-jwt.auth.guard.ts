import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { CustomerJwtAuthGuard } from './customer-jwt.auth.guard';

@Injectable()
export class OptionalCustomerJwtAuthGuard implements CanActivate {
  constructor(private readonly inner: CustomerJwtAuthGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      return await this.inner.canActivate(context);
    } catch {
      request.user = null;
      return true;
    }
  }
}
