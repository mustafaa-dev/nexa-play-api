import { SetMetadata } from '@nestjs/common';

// Enhanced decorators with builder pattern
export const ENHANCED_AUTH_KEY = 'enhanced_auth';

export interface IAuthRequirement {
  type: 'role' | 'permission' | 'custom';
  value: string | string[];
  operator?: 'AND' | 'OR';
}

export interface IEnhancedAuthConfig {
  requirements: IAuthRequirement[];
  bypassForRoles?: string[];
  customValidator?: string; // reference to custom validator
  errorMessage?: string;
}

export class AuthConfigBuilder {
  private config: IEnhancedAuthConfig = {
    requirements: [],
  };

  static create(): AuthConfigBuilder {
    return new AuthConfigBuilder();
  }

  requireRole(role: string): AuthConfigBuilder {
    this.config.requirements.push({
      type: 'role',
      value: role,
    });
    return this;
  }

  requireRoles(roles: string[], operator: 'AND' | 'OR' = 'OR'): AuthConfigBuilder {
    this.config.requirements.push({
      type: 'role',
      value: roles,
      operator,
    });
    return this;
  }

  requirePermission(permission: string): AuthConfigBuilder {
    this.config.requirements.push({
      type: 'permission',
      value: permission,
    });
    return this;
  }

  requirePermissions(permissions: string[], operator: 'AND' | 'OR' = 'OR'): AuthConfigBuilder {
    this.config.requirements.push({
      type: 'permission',
      value: permissions,
      operator,
    });
    return this;
  }

  requireCustom(validatorName: string): AuthConfigBuilder {
    this.config.requirements.push({
      type: 'custom',
      value: validatorName,
    });
    return this;
  }

  bypassFor(roles: string[]): AuthConfigBuilder {
    this.config.bypassForRoles = roles;
    return this;
  }

  withErrorMessage(message: string): AuthConfigBuilder {
    this.config.errorMessage = message;
    return this;
  }

  build(): IEnhancedAuthConfig {
    return { ...this.config };
  }
}

/**
 * Enhanced authorization decorator with flexible configuration
 */
export const EnhancedAuth = (
  config: IEnhancedAuthConfig | ((builder: AuthConfigBuilder) => AuthConfigBuilder),
) => {
  let finalConfig: IEnhancedAuthConfig;

  if (typeof config === 'function') {
    finalConfig = config(AuthConfigBuilder.create()).build();
  } else {
    finalConfig = config;
  }

  return SetMetadata(ENHANCED_AUTH_KEY, finalConfig);
};

// Convenience decorators
export const RequireAnyRole = (...roles: string[]) =>
  EnhancedAuth(builder => builder.requireRoles(roles, 'OR'));

export const RequireAllRoles = (...roles: string[]) =>
  EnhancedAuth(builder => builder.requireRoles(roles, 'AND'));

export const RequireAnyPermission = (...permissions: string[]) =>
  EnhancedAuth(builder => builder.requirePermissions(permissions, 'OR'));

export const RequireAllPermissions = (...permissions: string[]) =>
  EnhancedAuth(builder => builder.requirePermissions(permissions, 'AND'));

export const AdminOnly = () =>
  EnhancedAuth(builder =>
    builder.requireRole('admin').withErrorMessage('This action requires administrator privileges'),
  );

export const OwnerOrAdmin = () =>
  EnhancedAuth(builder =>
    builder
      .requireCustom('ownerOrAdmin')
      .bypassFor(['admin'])
      .withErrorMessage('You can only access your own resources'),
  );
