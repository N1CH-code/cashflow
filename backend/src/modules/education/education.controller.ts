import { Controller, Get, Post, UseGuards, Param } from '@nestjs/common';
import { EducationService } from './education.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('education')
@UseGuards(AuthGuard)
export class EducationController {
  constructor(private readonly service: EducationService) {}

  @Get('articles')
  getArticles() {
    return this.service.getArticles();
  }

  @Get('articles/:id')
  getArticle(@Param('id') id: string) {
    return this.service.getArticle(id);
  }

  @Post('seed')
  seed() {
    return this.service.seedArticles();
  }
}
