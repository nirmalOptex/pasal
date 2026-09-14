import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AppDataSource } from '@database/data-source';
import { Business, Branch, Role, User, RefreshToken, TableArea, Table } from '@entities/index';
import { ConflictError, UnauthorizedError, NotFoundError } from '@shared/errors/app-error';
import { ROLE_DEFAULT_PERMISSIONS, PERMISSIONS } from '@shared/constants/permissions';
import { JwtUserPayload, UserRoleType, TableStatus } from '@chhiyapasal/shared-types';

export class AuthService {
  private userRepo = AppDataSource.getRepository(User);
  private businessRepo = AppDataSource.getRepository(Business);
  private roleRepo = AppDataSource.getRepository(Role);
  private branchRepo = AppDataSource.getRepository(Branch);
  private tokenRepo = AppDataSource.getRepository(RefreshToken);

  async register(data: {
    businessName: string;
    currency?: string;
    name: string;
    email: string;
    password: string;
    phone?: string;
    branchName?: string;
    branchAddress?: string;
  }) {
    const existingUser = await this.userRepo.findOne({ where: { email: data.email } });
    if (existingUser) {
      throw new ConflictError('A user with this email address already exists');
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Create Business
      const business = queryRunner.manager.create(Business, {
        name: data.businessName,
        currency: data.currency || 'NPR',
        timezone: 'Asia/Kathmandu',
      });
      await queryRunner.manager.save(business);

      // 2. Create System Roles
      const ownerRole = queryRunner.manager.create(Role, {
        business_id: business.id,
        name: UserRoleType.OWNER,
        permissions: ROLE_DEFAULT_PERMISSIONS.OWNER,
        is_system: true,
      });
      const managerRole = queryRunner.manager.create(Role, {
        business_id: business.id,
        name: UserRoleType.BRANCH_MANAGER,
        permissions: ROLE_DEFAULT_PERMISSIONS.BRANCH_MANAGER,
        is_system: true,
      });
      const cashierRole = queryRunner.manager.create(Role, {
        business_id: business.id,
        name: UserRoleType.CASHIER,
        permissions: ROLE_DEFAULT_PERMISSIONS.CASHIER,
        is_system: true,
      });
      const waiterRole = queryRunner.manager.create(Role, {
        business_id: business.id,
        name: UserRoleType.WAITER,
        permissions: ROLE_DEFAULT_PERMISSIONS.WAITER,
        is_system: true,
      });
      const kitchenRole = queryRunner.manager.create(Role, {
        business_id: business.id,
        name: UserRoleType.KITCHEN_STAFF,
        permissions: ROLE_DEFAULT_PERMISSIONS.KITCHEN_STAFF,
        is_system: true,
      });

      await queryRunner.manager.save([ownerRole, managerRole, cashierRole, waiterRole, kitchenRole]);

      // 3. Create Default Branch
      const branch = queryRunner.manager.create(Branch, {
        business_id: business.id,
        name: data.branchName || 'Main Branch',
        address: data.branchAddress || 'Kathmandu',
        phone: data.phone,
      });
      await queryRunner.manager.save(branch);

      // 4. Create Default Table Areas and Tables
      const indoorArea = queryRunner.manager.create(TableArea, {
        branch_id: branch.id,
        name: 'Indoor Hall',
        description: 'Main dining area',
      });
      const outdoorArea = queryRunner.manager.create(TableArea, {
        branch_id: branch.id,
        name: 'Outdoor / Patio',
        description: 'Open air seating',
      });
      await queryRunner.manager.save([indoorArea, outdoorArea]);

      const tables = [
        queryRunner.manager.create(Table, { branch_id: branch.id, table_area_id: indoorArea.id, name: 'T1', capacity: 4, status: TableStatus.AVAILABLE }),
        queryRunner.manager.create(Table, { branch_id: branch.id, table_area_id: indoorArea.id, name: 'T2', capacity: 4, status: TableStatus.AVAILABLE }),
        queryRunner.manager.create(Table, { branch_id: branch.id, table_area_id: indoorArea.id, name: 'T3', capacity: 2, status: TableStatus.AVAILABLE }),
        queryRunner.manager.create(Table, { branch_id: branch.id, table_area_id: outdoorArea.id, name: 'O1', capacity: 4, status: TableStatus.AVAILABLE }),
        queryRunner.manager.create(Table, { branch_id: branch.id, table_area_id: outdoorArea.id, name: 'O2', capacity: 6, status: TableStatus.AVAILABLE }),
      ];
      await queryRunner.manager.save(tables);

      // 5. Create Owner User
      const passwordHash = await bcrypt.hash(data.password, 10);
      const user = queryRunner.manager.create(User, {
        business_id: business.id,
        branch_id: branch.id,
        role_id: ownerRole.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        password_hash: passwordHash,
      });
      await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();

      // Generate Tokens
      const tokens = await this.generateTokens(user, ownerRole, business.id, branch.id);

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          businessId: business.id,
          businessName: business.name,
          currency: business.currency,
          branchId: branch.id,
          branchName: branch.name,
          role: ownerRole.name,
          permissions: ownerRole.permissions,
        },
        ...tokens,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async login(email: string, pass: string) {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.business', 'business')
      .leftJoinAndSelect('user.branch', 'branch')
      .where('user.email = :email', { email })
      .getOne();

    if (!user || !user.is_active) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValid = await bcrypt.compare(pass, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    user.last_login_at = new Date();
    await this.userRepo.save(user);

    const tokens = await this.generateTokens(user, user.role, user.business_id, user.branch_id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        businessId: user.business_id,
        businessName: user.business?.name,
        currency: user.business?.currency || 'NPR',
        branchId: user.branch_id,
        branchName: user.branch?.name,
        role: user.role?.name,
        permissions: user.role?.permissions || [],
      },
      ...tokens,
    };
  }

  async refreshToken(tokenString: string) {
    const hashed = crypto.createHash('sha256').update(tokenString).digest('hex');
    const existingToken = await this.tokenRepo.findOne({
      where: { token_hash: hashed },
      relations: ['user', 'user.role', 'user.business'],
    });

    if (!existingToken || existingToken.revoked_at || existingToken.expires_at < new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Revoke old token
    existingToken.revoked_at = new Date();
    await this.tokenRepo.save(existingToken);

    const user = existingToken.user;
    return this.generateTokens(user, user.role, user.business_id, user.branch_id);
  }

  async logout(tokenString: string) {
    if (!tokenString) return;
    const hashed = crypto.createHash('sha256').update(tokenString).digest('hex');
    await this.tokenRepo.update({ token_hash: hashed }, { revoked_at: new Date() });
  }

  async loginWithPin(pin: string, branchId?: string, employeeId?: string) {
    if (!pin || pin.length < 4) {
      throw new UnauthorizedError('Please enter a valid 4-to-6 digit PIN');
    }

    let user: User | null = null;

    if (employeeId) {
      user = await this.userRepo
        .createQueryBuilder('user')
        .addSelect('user.pin_hash')
        .leftJoinAndSelect('user.role', 'role')
        .leftJoinAndSelect('user.business', 'business')
        .leftJoinAndSelect('user.branch', 'branch')
        .where('user.id = :employeeId', { employeeId })
        .andWhere('user.is_active = true')
        .getOne();

      if (!user) {
        throw new UnauthorizedError('Employee not found or account is deactivated');
      }

      if (!user.pin_hash) {
        throw new UnauthorizedError('This staff member has no POS PIN configured. Please log in with password or have a manager set your PIN.');
      }

      const isValid = await bcrypt.compare(pin, user.pin_hash);
      if (!isValid) {
        throw new UnauthorizedError('Incorrect PIN code');
      }
    } else {
      const query = this.userRepo
        .createQueryBuilder('user')
        .addSelect('user.pin_hash')
        .leftJoinAndSelect('user.role', 'role')
        .leftJoinAndSelect('user.business', 'business')
        .leftJoinAndSelect('user.branch', 'branch')
        .where('user.is_active = true')
        .andWhere('user.pin_hash IS NOT NULL');

      if (branchId) {
        query.andWhere('(user.branch_id = :branchId OR user.branch_id IS NULL)', { branchId });
      }

      const candidateUsers = await query.getMany();
      for (const candidate of candidateUsers) {
        if (candidate.pin_hash && (await bcrypt.compare(pin, candidate.pin_hash))) {
          user = candidate;
          break;
        }
      }

      if (!user) {
        throw new UnauthorizedError('Incorrect PIN or employee not found');
      }
    }

    user.last_login_at = new Date();
    await this.userRepo.save(user);

    const tokens = await this.generateTokens(user, user.role, user.business_id, user.branch_id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        businessId: user.business_id,
        businessName: user.business?.name,
        currency: user.business?.currency || 'NPR',
        branchId: user.branch_id,
        branchName: user.branch?.name,
        role: user.role?.name,
        permissions: user.role?.permissions || [],
      },
      ...tokens,
    };
  }

  async getBranchStaff(branchId?: string) {
    const query = this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.pin_hash')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.branch', 'branch')
      .where('user.is_active = true')
      .orderBy('user.name', 'ASC');

    if (branchId) {
      query.andWhere('(user.branch_id = :branchId OR user.branch_id IS NULL)', { branchId });
    }

    const staffList = await query.getMany();
    return staffList.map((s) => ({
      id: s.id,
      name: s.name,
      role: s.role?.name || 'STAFF',
      branchId: s.branch_id,
      branchName: s.branch?.name || 'All Branches',
      hasPin: Boolean(s.pin_hash),
    }));
  }

  private async generateTokens(
    user: User,
    role: Role,
    businessId: string,
    branchId?: string | null
  ) {
    const accessSecret = process.env.JWT_ACCESS_SECRET || 'access_secret';
    const payload: JwtUserPayload = {
      userId: user.id,
      businessId,
      branchId,
      roleId: role.id,
      roleName: role.name,
      permissions: role.permissions || [],
    };

    const accessToken = jwt.sign(payload, accessSecret, {
      expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as any,
    });

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const refreshTokenEntity = this.tokenRepo.create({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });
    await this.tokenRepo.save(refreshTokenEntity);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    };
  }
}
