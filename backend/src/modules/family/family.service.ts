import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as crypto from 'crypto';

@Injectable()
export class FamilyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async getMyFamily(userId: string) {
    const member = await this.prisma.familyMember.findFirst({
      where: { userId },
      include: {
        family: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true, photoUrl: true, telegramUsername: true },
                },
              },
            },
          },
        },
      },
    });

    if (!member) return null;
    return member.family;
  }

  async create(userId: string, name: string) {
    const existing = await this.prisma.familyMember.findFirst({ where: { userId } });
    if (existing) throw new ConflictException('You are already in a family');

    const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    const family = await this.prisma.family.create({
      data: {
        name,
        createdBy: userId,
        inviteCode,
        members: {
          create: { userId, role: 'OWNER' },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, photoUrl: true },
            },
          },
        },
      },
    });

    return family;
  }

  async join(userId: string, inviteCode: string) {
    const family = await this.prisma.family.findUnique({ where: { inviteCode } });
    if (!family) throw new NotFoundException('Invalid invite code');

    const existing = await this.prisma.familyMember.findFirst({ where: { userId } });
    if (existing) throw new ConflictException('You are already in a family');

    const member = await this.prisma.familyMember.create({
      data: { userId, familyId: family.id, role: 'MEMBER' },
      include: {
        family: true,
        user: { select: { id: true, firstName: true } },
      },
    });

    const owner = await this.prisma.familyMember.findFirst({
      where: { familyId: family.id, role: 'OWNER' },
    });

    if (owner) {
      await this.notifications.createNotification(
        owner.userId,
        'REFERRAL_SIGNUP',
        'New Family Member',
        `${member.user.firstName || 'Someone'} joined your family "${family.name}"!`,
        { familyId: family.id },
      );
    }

    return member.family;
  }

  async getMembers(userId: string) {
    const member = await this.prisma.familyMember.findFirst({ where: { userId } });
    if (!member) throw new NotFoundException('You are not in a family');

    return this.prisma.familyMember.findMany({
      where: { familyId: member.familyId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, photoUrl: true, telegramUsername: true },
        },
      },
    });
  }

  async updateMemberRole(userId: string, memberId: string, role: string) {
    const member = await this.prisma.familyMember.findFirst({ where: { userId } });
    if (!member || member.role !== 'OWNER') throw new ForbiddenException('Only the owner can change roles');

    if (!['ADMIN', 'MEMBER'].includes(role)) throw new BadRequestException('Invalid role');

    return this.prisma.familyMember.update({
      where: { id: memberId },
      data: { role },
    });
  }

  async removeMember(userId: string, memberId: string) {
    const member = await this.prisma.familyMember.findFirst({ where: { userId } });
    if (!member || member.role !== 'OWNER') throw new ForbiddenException('Only the owner can remove members');

    const target = await this.prisma.familyMember.findUnique({ where: { id: memberId } });
    if (!target) throw new NotFoundException('Member not found');
    if (target.role === 'OWNER') throw new BadRequestException('Cannot remove the owner');

    await this.prisma.familyMember.delete({ where: { id: memberId } });
    return { removed: true };
  }

  async leave(userId: string) {
    const member = await this.prisma.familyMember.findFirst({ where: { userId } });
    if (!member) throw new NotFoundException('You are not in a family');

    if (member.role === 'OWNER') {
      const count = await this.prisma.familyMember.count({ where: { familyId: member.familyId } });
      if (count > 1) throw new BadRequestException('Transfer ownership first or delete the family');
      await this.prisma.family.delete({ where: { id: member.familyId } });
      return { left: true, familyDeleted: true };
    }

    await this.prisma.familyMember.delete({ where: { id: member.id } });
    return { left: true };
  }

  async getFamilyGoals(userId: string) {
    const member = await this.prisma.familyMember.findFirst({ where: { userId } });
    if (!member) throw new NotFoundException('You are not in a family');

    return this.prisma.goal.findMany({
      where: {
        OR: [
          { familyId: member.familyId },
          { visibility: 'FAMILY' },
        ],
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFamilyTransactions(userId: string) {
    const member = await this.prisma.familyMember.findFirst({ where: { userId } });
    if (!member) throw new NotFoundException('You are not in a family');

    const familyMemberIds = await this.prisma.familyMember.findMany({
      where: { familyId: member.familyId },
      select: { userId: true },
    });

    const memberIds = familyMemberIds.map((m) => m.userId);

    return this.prisma.transaction.findMany({
      where: { userId: { in: memberIds } },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        category: true,
      },
      orderBy: { date: 'desc' },
      take: 100,
    });
  }

  async getFamilyStats(userId: string) {
    const member = await this.prisma.familyMember.findFirst({ where: { userId } });
    if (!member) throw new NotFoundException('You are not in a family');

    const familyMemberIds = await this.prisma.familyMember.findMany({
      where: { familyId: member.familyId },
      select: { userId: true },
    });

    const memberIds = familyMemberIds.map((m) => m.userId);

    const [totalIncome, totalExpenses, memberCount] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { userId: { in: memberIds }, type: 'INCOME' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { userId: { in: memberIds }, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
      this.prisma.familyMember.count({ where: { familyId: member.familyId } }),
    ]);

    return {
      totalIncome: totalIncome._sum.amount || 0,
      totalExpenses: totalExpenses._sum.amount || 0,
      balance: (totalIncome._sum.amount || 0) - (totalExpenses._sum.amount || 0),
      memberCount,
    };
  }
}
