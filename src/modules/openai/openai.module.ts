import { DynamicModule, Global, Module } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { OpenAIProvider } from './openai.provider';

@Global()
@Module({
  providers: [OpenAIService],
})
export class OpenAIModule {
  static forRoot(): DynamicModule {
    return {
      module: OpenAIModule,
      providers: [OpenAIProvider, OpenAIService],
      exports: [OpenAIProvider, OpenAIService],
    };
  }
}
