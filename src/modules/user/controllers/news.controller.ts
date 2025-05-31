import { Controller, Get } from '@nestjs/common';
import { NewsService } from '../services/news.service';
import { Public } from 'src/lib/decorators/public-route.decorators';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @Public()
  async getNews() {
    return this.newsService.getNews();
  }
}
