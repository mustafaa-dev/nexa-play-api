import { Injectable } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

/**
 * PermissionsGuard is an alias for AuthGuard, which handles
 * both role-based and permission-based access control.
 *
 * This provides a semantic separation for controllers that specifically
 * want to check permissions rather than roles.
 */
@Injectable()
export class PermissionsGuard extends AuthGuard {}
