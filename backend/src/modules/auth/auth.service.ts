import * as crypto from 'node:crypto';
import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma.service';
import { TelegramAuthDto } from './dto/telegram-auth.dto';

@Injectable()
export class AuthService {
  private readonly botToken: string;

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      throw new InternalServerErrorException('TELEGRAM_BOT_TOKEN is not configured');
    }
    this.botToken = token;
  }

  async login(initData: string): Promise<{ access_token: string }> {
    const telegramUser = this.validateTelegramLogin(initData);
    const user = await this.findOrCreateUser(telegramUser);
    const access_token = this.generateToken(user);
    return { access_token };
  }

  async devLogin(): Promise<{ access_token: string }> {
    let user = await this.prisma.user.findUnique({
      where: { telegramId: 'dev_user_1' },
    });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          telegramId: 'dev_user_1',
          firstName: 'Dev',
          lastName: 'User',
          telegramUsername: 'devuser',
          languageCode: 'en',
          currency: 'EUR',
          onboardingComplete: true,
        },
      });
    }
    const access_token = this.generateToken(user);
    return { access_token };
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        telegramId: true,
        telegramUsername: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        languageCode: true,
        role: true,
        plan: true,
        currency: true,
        level: true,
        xp: true,
        streak: true,
        referralCode: true,
        createdAt: true,
      },
    });
  }

  private validateTelegramLogin(initData: string): TelegramAuthDto {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) {
      throw new UnauthorizedException('Missing hash in Telegram init data');
    }

    const userRaw = params.get('user');
    if (!userRaw) {
      throw new UnauthorizedException('Missing user in Telegram init data');
    }

    let user: TelegramAuthDto;
    try {
      user = JSON.parse(userRaw);
    } catch {
      throw new UnauthorizedException('Invalid user data in Telegram init data');
    }

    const checkList: string[] = [];
    for (const [key, value] of params.entries()) {
      if (key === 'hash') continue;
      checkList.push(`${key}=${value}`);
    }
    checkList.sort();
    const dataCheckString = checkList.join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(this.botToken)
      .digest();

    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (computedHash !== hash) {
      throw new UnauthorizedException('Invalid Telegram login data');
    }

    return user;
  }

  private async findOrCreateUser(telegramUser: TelegramAuthDto) {
    const telegramId = String(telegramUser.id);

    const existing = await this.prisma.user.findUnique({
      where: { telegramId },
    });

    if (existing) {
      return this.prisma.user.update({
        where: { telegramId },
        data: {
          telegramUsername: telegramUser.username ?? existing.telegramUsername,
          firstName: telegramUser.first_name ?? existing.firstName,
          lastName: telegramUser.last_name ?? existing.lastName,
          photoUrl: telegramUser.photo_url ?? existing.photoUrl,
          languageCode: telegramUser.language_code ?? existing.languageCode,
        },
      });
    }

    return this.prisma.user.create({
      data: {
        telegramId,
        telegramUsername: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        photoUrl: telegramUser.photo_url,
        languageCode: telegramUser.language_code ?? 'en',
      },
    });
  }

  private generateToken(user: { id: string; telegramId: string; role: string }): string {
    return this.jwt.sign({
      sub: user.id,
      telegramId: user.telegramId,
      role: user.role,
    });
  }
}
