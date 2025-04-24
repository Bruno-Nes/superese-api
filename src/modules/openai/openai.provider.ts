import OpenAi from 'openai';

export const OpenAIProvider = {
  provide: 'OPENAI_API',
  useFactory: () => {
    const configuration = new OpenAi({
      apiKey: process.env.OPENAI_API_KEY,
    });

    return configuration;
  },
};
