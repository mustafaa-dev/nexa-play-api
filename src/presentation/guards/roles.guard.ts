import { Injectable } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

/**
 * RolesGuard is now an alias for AuthGuard, which has been enhanced
 * to handle both role-based and permission-based access control.
 *
 * This guard is kept for backward compatibility.
 */
@Injectable()
export class RolesGuard extends AuthGuard {}
