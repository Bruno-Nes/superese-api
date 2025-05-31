export class PostDetailsResponseDTO {
  id: string;
  title: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  comments: Comment[];
  profile: {
    username: string;
    foto?: string;
  };
}
