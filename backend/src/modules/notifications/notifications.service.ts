import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        unreadCount: notifications.filter((n) => !n.isRead).length,
      },
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { unreadCount: count };
  }

  async markAsRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return { id, read: true };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { success: true };
  }

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, any>,
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        data: data ?? {},
      },
    });
  }

  async sendBudgetAlert(
    userId: string,
    categoryName: string,
    budgetAmount: number,
    spentAmount: number,
  ) {
    return this.createNotification(
      userId,
      'BUDGET_ALERT',
      `Budget Alert: ${categoryName}`,
      `You've spent ${spentAmount} of ${budgetAmount} budget for ${categoryName}.`,
      { categoryName, budgetAmount, spentAmount },
    );
  }

  async sendGoalMilestone(
    userId: string,
    goalName: string,
    progress: number,
  ) {
    return this.createNotification(
      userId,
      'GOAL_MILESTONE',
      `Goal Progress: ${goalName}`,
      `You're ${progress}% toward your goal "${goalName}". Keep going!`,
      { goalName, progress },
    );
  }

  async sendAchievementUnlocked(
    userId: string,
    achievementName: string,
    xpReward: number,
  ) {
    return this.createNotification(
      userId,
      'ACHIEVEMENT_UNLOCKED',
      `Achievement Unlocked: ${achievementName}`,
      `Congratulations! You've earned "${achievementName}" and received ${xpReward} XP!`,
      { achievementName, xpReward },
    );
  }

  async sendAIRecommendation(
    userId: string,
    recommendation: string,
    details?: Record<string, any>,
  ) {
    return this.createNotification(
      userId,
      'AI_RECOMMENDATION',
      'AI Financial Tip',
      recommendation,
      details,
    );
  }

  async sendOverspendWarning(
    userId: string,
    categoryName: string,
    overspentAmount: number,
  ) {
    return this.createNotification(
      userId,
      'OVERSPEND_WARNING',
      `Overspend Warning: ${categoryName}`,
      `You've overspent ${categoryName} by ${overspentAmount}. Consider adjusting your budget.`,
      { categoryName, overspentAmount },
    );
  }
}
