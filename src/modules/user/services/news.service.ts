import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class NewsService {
  private readonly apiKey = '700465df74282c13a5591d1ff99d919c';

  async getNews(): Promise<any> {
    const url = `https://gnews.io/api/v4/search?q=bets&lang=pt&max=10&apikey=${this.apiKey}`;

    const response = await axios.get(url);

    return response.data.articles.map((a: any) => ({
      title: a.title,
      summary: a.description,
      image: a.image,
      url: a.url,
    }));
  }
}
