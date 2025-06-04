export class GPTConsultationResponseDto {
  message: string;
  gptResponse: string;
  conversationId: string;
  planCreated?: {
    id: string;
    title: string;
    description: string;
    steps: string[];
  };
}
