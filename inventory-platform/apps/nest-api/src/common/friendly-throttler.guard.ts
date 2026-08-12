import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

// The stock ThrottlerGuard's default rejection message is its own class name
// ("ThrottlerException: Too Many Requests") — technically accurate, not
// something to show a customer mid-checkout.
@Injectable()
export class FriendlyThrottlerGuard extends ThrottlerGuard {
  protected override errorMessage = 'Too many requests — please wait a moment and try again.';
}
