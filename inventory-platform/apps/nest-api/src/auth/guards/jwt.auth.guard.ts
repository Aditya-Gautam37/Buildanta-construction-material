import {
	CanActivate,
	ExecutionContext,
	Injectable,
	ForbiddenException,
	InternalServerErrorException,
	UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { UserRole } from '@workspace/db';
import { PrismaService } from '../../database/prisma.service';

export function isInventoryStaff(role: UserRole) {
	const staffRoles: UserRole[] = [
		UserRole.ADMIN,
		UserRole.DATA_ENTRY,
		UserRole.CATALOG_MANAGER,
		UserRole.SALES,
		UserRole.WAREHOUSE_MANAGER,
		UserRole.PROCUREMENT,
		UserRole.FINANCE,
		UserRole.SUPPORT,
	];
	return staffRoles.includes(role);
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
	private readonly supabase: SupabaseClient;

	constructor(
		private readonly configService: ConfigService,
		private readonly prisma: PrismaService,
	) {
		const supabaseUrl =
			this.configService.get<string>('SUPABASE_URL') ??
			this.configService.get<string>('NEXT_PUBLIC_SUPABASE_URL');
		const supabasePublishableKey =
			this.configService.get<string>('SUPABASE_PUBLISHABLE_KEY') ??
			this.configService.get<string>('SUPABASE_ANON_KEY') ??
			this.configService.get<string>('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ??
			this.configService.get<string>('NEXT_PUBLIC_SUPABASE_ANON_KEY');

		if (!supabaseUrl || !supabasePublishableKey) {
			throw new InternalServerErrorException(
				'Missing SUPABASE_URL or Supabase publishable key in Nest environment.',
			);
		}

		this.supabase = createClient(supabaseUrl, supabasePublishableKey, {
			auth: {
				persistSession: false,
				autoRefreshToken: false,
			},
		});
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const header = request.headers?.authorization;

		if (typeof header !== 'string' || !header.toLowerCase().startsWith('bearer ')) {
			throw new UnauthorizedException('Missing bearer token.');
		}

		const token = header.slice(7).trim();

		if (!token) {
			throw new UnauthorizedException('Missing bearer token.');
		}

		const { data, error } = await this.supabase.auth.getUser(token);

		if (error || !data.user) {
			throw new UnauthorizedException('Invalid or expired token.');
		}

		const profile = await this.prisma.client.user.findUnique({
			where: { id: data.user.id },
			select: { id: true, email: true, role: true },
		});
		if (!profile || !isInventoryStaff(profile.role)) {
			throw new ForbiddenException('Inventory staff access is required.');
		}

		request.user = { ...data.user, databaseRole: profile.role };
		return true;
	}
}
