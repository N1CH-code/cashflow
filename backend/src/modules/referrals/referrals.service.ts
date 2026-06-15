import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { ApplyReferralDto } from './dto/apply-referral.dto';

@Injectable()
export class ReferralsService {
  constructor(private readonly prisma: PrismaService) {}

  async getReferralInfo(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true, referralCount: true },
    });

    const referrals = await this.prisma.referral.findMany({
      where: { inviterId: userId },
      include: {
        referee: {
          select: { id: true, firstName: true, telegramUsername: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rewards = referrals
      .filter((r) => r.rewardClaimed)
      .reduce(
        (acc, r) => {
          if (r.rewardType === 'PREMIUM_7_DAYS') acc.premiumDays += 7;
          else if (r.rewardType === 'AI_REQUESTS_100') acc.aiRequests += 100;
          else if (r.rewardType === 'XP_100') acc.xp += 100;
          return acc;
        },
        { premiumDays: 0, aiRequests: 0, xp: 0 },
      );

    return {
      referralCode: user?.referralCode,
      totalReferrals: user?.referralCount ?? 0,
      referrals: referrals.map((r) => ({
        id: r.id,
        referee: r.referee.firstName ?? r.referee.telegramUsername ?? 'Unknown',
        rewardType: r.rewardType,
        rewardClaimed: r.rewardClaimed,
        date: r.createdAt,
      })),
      rewards,
    };
  }

  async applyReferral(userId: string, dto: ApplyReferralDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.referredBy) {
      throw new BadRequestException('You have already used a referral code');
    }

    const inviter = await this.prisma.user.findUnique({
      where: { referralCode: dto.code },
    });

    if (!inviter) {
      throw new BadRequestException('Invalid referral code');
    }

    if (inviter.id === userId) {
      throw new BadRequestException('You cannot refer yourself');
    }

    const existing = await this.prisma.referral.findUnique({
      where: { refereeId: userId },
    });

    if (existing) {
      throw new BadRequestException('This user has already been referred');
    }

    const rewardType = this.selectReward();

    await this.prisma.$transaction(async (tx) => {
      await tx.referral.create({
        data: {
          inviterId: inviter.id,
          refereeId: userId,
          rewardType,
          rewardClaimed: true,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { referredBy: inviter.id },
      });

      await tx.user.update({
        where: { id: inviter.id },
        data: { referralCount: { increment: 1 } },
      });

      if (rewardType === 'XP_100') {
        await tx.user.update({
          where: { id: inviter.id },
          data: { xp: { increment: 100 } },
        });
      }
    });

    return {
      message: 'Referral code applied successfully',
      rewardType,
    };
  }

  async getLeaderboard() {
    const users = await this.prisma.user.findMany({
      where: { referralCount: { gt: 0 } },
      select: {
        id: true,
        firstName: true,
        telegramUsername: true,
        photoUrl: true,
        referralCount: true,
      },
      orderBy: { referralCount: 'desc' },
      take: 20,
    });

    return users.map((u, idx) => ({
      rank: idx + 1,
      id: u.id,
      name: u.firstName ?? u.telegramUsername ?? 'Anonymous',
      photoUrl: u.photoUrl,
      referrals: u.referralCount,
    }));
  }

  private selectReward(): string {
    const rewards = ['PREMIUM_7_DAYS', 'AI_REQUESTS_100', 'XP_100'];
    return rewards[Math.floor(Math.random() * rewards.length)];
  }
}
