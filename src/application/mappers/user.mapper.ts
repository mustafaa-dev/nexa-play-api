import { IUserBaseResponse, IUserDetailResponse } from '@application/dtos/responses/user.response';

import { User } from '@core/entities/user.entity';
import { RolesEnum } from '@shared/constants/roles.constants';

export class UserMapper {
  /**
   * Maps a Role entity to a IUserRoleResponse DTO
   */
  static toRoleResponse(role: RolesEnum): string {
    return role;
  }

  /**
   * Maps a User entity to a IUserBaseResponse DTO
   */
  static toBaseResponse(user: User, emailVerified: boolean = false): IUserBaseResponse {
    return {
      email: user?.email.getValue(),
      firstName: user?.firstName.getValue(),
      lastName: user?.lastName.getValue(),
      phoneNumber: user?.phoneNumber.getValue(),
      status: user?.status,
      emailVerified,
      avatar: user?.avatar?.url,
    };
  }

  /**
   * Maps a User entity to a IUserDetailResponse DTO
   */
  static toDetailResponse(user: User, emailVerified: boolean = false): IUserDetailResponse {
    return {
      ...this.toBaseResponse(user, emailVerified),
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      role: this?.toRoleResponse(user?.role),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Maps a User entity to a IUserWithAuthResponse DTO
   */
  static toAuthResponse(
    user: User,
    emailVerified: boolean = false,
  ): IUserBaseResponse & { role: string } {
    return {
      ...this.toBaseResponse(user, emailVerified),
      role: this.toRoleResponse(user.role),
    };
  }
}
