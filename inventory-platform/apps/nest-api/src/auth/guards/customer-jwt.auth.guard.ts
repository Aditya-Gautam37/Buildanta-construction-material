import { CanActivate, ExecutionContext, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { UserRole } from '@workspace/db';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CustomerJwtAuthGuard implements CanActivate {
  private readonly supabase: SupabaseClient;
  constructor(config: ConfigService, private readonly prisma: PrismaService) {
    const url=config.get<string>('SUPABASE_URL')??config.get<string>('NEXT_PUBLIC_SUPABASE_URL');
    const key=config.get<string>('SUPABASE_PUBLISHABLE_KEY')??config.get<string>('SUPABASE_ANON_KEY')??config.get<string>('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
    if(!url||!key) throw new InternalServerErrorException('Customer authentication is not configured.');
    this.supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  }
  async canActivate(context:ExecutionContext){
    const request=context.switchToHttp().getRequest();
    const header=request.headers?.authorization;
    if(typeof header!=="string"||!header.toLowerCase().startsWith("bearer ")) throw new UnauthorizedException('Missing bearer token.');
    const {data,error}=await this.supabase.auth.getUser(header.slice(7).trim());
    const email=data.user?.email?.toLowerCase();
    if(error||!data.user||!email) throw new UnauthorizedException('Invalid or expired customer session.');
    const metadata=data.user.user_metadata??{};
    const firstName=typeof metadata.firstName==="string"?metadata.firstName:typeof metadata.first_name==="string"?metadata.first_name:null;
    const lastName=typeof metadata.lastName==="string"?metadata.lastName:typeof metadata.last_name==="string"?metadata.last_name:null;
    const existing=await this.prisma.client.user.findUnique({where:{id:data.user.id},select:{id:true,email:true,role:true}});
    // A verified Supabase identity may be both an Inventory staff member and a
    // storefront customer. Preserve its staff role and authorize portal data by
    // the verified email; only missing/customer profiles need a customer upsert.
    const profile=existing&&existing.role!==UserRole.CUSTOMER
      ? existing
      : await this.prisma.client.user.upsert({where:{id:data.user.id},create:{id:data.user.id,email,firstName,lastName,role:UserRole.CUSTOMER},update:{email,firstName,lastName},select:{id:true,email:true,role:true}});
    request.user={id:profile.id,email,databaseRole:profile.role};
    return true;
  }
}
