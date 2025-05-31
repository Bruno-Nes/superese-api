# Forum API Documentation

Esta documentação fornece informações detalhadas sobre como usar a API do Fórum para desenvolver o frontend da aplicação.

## Visão Geral

A API do Fórum permite gerenciar posts, comentários e likes em um sistema de fórum social. Todas as rotas requerem autenticação via Firebase Auth.

### Base URL

```
/posts
```

### Autenticação

Todas as rotas requerem o header de autorização:

```
Authorization: Bearer <firebase-id-token>
```

## Endpoints

### 1. Criar Post

Cria um novo post no fórum.

**Endpoint:** `POST /posts`

**Autenticação:** Requerida

**Request Body:**

```json
{
  "title": "Título do post",
  "content": "Conteúdo do post aqui..."
}
```

**Response (201):**

```json
{
  "id": "uuid-123",
  "title": "Título do post",
  "content": "Conteúdo do post aqui...",
  "likesCount": 0,
  "commentsCount": 0,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "profile": {
    "id": "uuid-456",
    "username": "joao123"
  }
}
```

**Exemplo de uso (JavaScript/TypeScript):**

```typescript
const createPost = async (title: string, content: string) => {
  const response = await fetch('/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${firebaseToken}`,
    },
    body: JSON.stringify({ title, content }),
  });

  return await response.json();
};
```

---

### 2. Listar Posts

Retorna uma lista paginada de posts. O algoritmo prioriza o último post do usuário autenticado (se criado nos últimos 30 minutos).

**Endpoint:** `GET /posts`

**Autenticação:** Requerida

**Query Parameters:**

- `limit` (opcional): Número máximo de posts por página (padrão: 10)
- `offset` (opcional): Número de posts para pular (padrão: 0)

**Response (200):**

```json
[
  {
    "id": "uuid-123",
    "title": "Título do post",
    "content": "Conteúdo do post...",
    "likesCount": 15,
    "commentsCount": 5,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "profile": {
      "id": "uuid-456",
      "username": "joao123"
    }
  }
]
```

**Exemplo de uso (JavaScript/TypeScript):**

```typescript
const getPosts = async (limit = 10, offset = 0) => {
  const response = await fetch(`/posts?limit=${limit}&offset=${offset}`, {
    headers: {
      Authorization: `Bearer ${firebaseToken}`,
    },
  });

  return await response.json();
};
```

---

### 3. Detalhes do Post

Retorna os detalhes completos de um post específico, incluindo seus comentários.

**Endpoint:** `GET /posts/post-details/:id`

**Autenticação:** Requerida

**Path Parameters:**

- `id`: ID do post

**Response (200):**

```json
{
  "id": "uuid-123",
  "title": "Título do post",
  "content": "Conteúdo do post...",
  "likesCount": 15,
  "commentsCount": 5,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "profile": {
    "id": "uuid-456",
    "username": "joao123"
  },
  "comments": [
    {
      "id": "uuid-789",
      "content": "Excelente post!",
      "createdAt": "2024-01-15T11:00:00Z",
      "profile": {
        "id": "uuid-abc",
        "username": "maria456"
      },
      "replies": []
    }
  ]
}
```

**Exemplo de uso (JavaScript/TypeScript):**

```typescript
const getPostDetails = async (postId: string) => {
  const response = await fetch(`/posts/post-details/${postId}`, {
    headers: {
      Authorization: `Bearer ${firebaseToken}`,
    },
  });

  return await response.json();
};
```

---

### 4. Curtir/Descurtir Post

Adiciona ou remove um like de um post. Se o usuário já curtiu, remove o like. Se não curtiu, adiciona o like.

**Endpoint:** `POST /posts/:id/like`

**Autenticação:** Requerida

**Path Parameters:**

- `id`: ID do post

**Response (200):**

```json
{
  "value": true,
  "message": "Post liked"
}
```

ou

```json
{
  "value": false,
  "message": "Post unliked"
}
```

**Exemplo de uso (JavaScript/TypeScript):**

```typescript
const toggleLike = async (postId: string) => {
  const response = await fetch(`/posts/${postId}/like`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${firebaseToken}`,
    },
  });

  return await response.json();
};
```

---

### 5. Comentar em Post

Adiciona um comentário a um post. Suporta comentários aninhados (respostas).

**Endpoint:** `POST /posts/:id/comment`

**Autenticação:** Requerida

**Path Parameters:**

- `id`: ID do post

**Request Body:**

```json
{
  "content": "Conteúdo do comentário",
  "parentCommentId": "uuid-opcional-para-resposta"
}
```

**Response (201):**

```json
{
  "id": "uuid-789",
  "content": "Conteúdo do comentário",
  "createdAt": "2024-01-15T11:00:00Z",
  "profile": {
    "id": "uuid-abc",
    "username": "maria456"
  },
  "parentComment": null
}
```

**Exemplo de uso (JavaScript/TypeScript):**

```typescript
const addComment = async (
  postId: string,
  content: string,
  parentCommentId?: string,
) => {
  const response = await fetch(`/posts/${postId}/comment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${firebaseToken}`,
    },
    body: JSON.stringify({
      content,
      ...(parentCommentId && { parentCommentId }),
    }),
  });

  return await response.json();
};
```

---

### 6. Listar Comentários

Retorna todos os comentários de um post em estrutura hierárquica.

**Endpoint:** `GET /posts/:id/comments`

**Autenticação:** Não requerida

**Path Parameters:**

- `id`: ID do post

**Response (200):**

```json
[
  {
    "id": "uuid-789",
    "content": "Comentário principal",
    "createdAt": "2024-01-15T11:00:00Z",
    "profile": {
      "id": "uuid-abc",
      "username": "maria456"
    },
    "replies": [
      {
        "id": "uuid-def",
        "content": "Resposta ao comentário",
        "createdAt": "2024-01-15T11:30:00Z",
        "profile": {
          "id": "uuid-ghi",
          "username": "pedro789"
        },
        "replies": []
      }
    ]
  }
]
```

**Exemplo de uso (JavaScript/TypeScript):**

```typescript
const getComments = async (postId: string) => {
  const response = await fetch(`/posts/${postId}/comments`);
  return await response.json();
};
```

---

### 7. Listar Likes

Retorna todos os likes de um post com informações dos usuários.

**Endpoint:** `GET /posts/:id/likes`

**Autenticação:** Não requerida

**Path Parameters:**

- `id`: ID do post

**Response (200):**

```json
[
  {
    "id": "uuid-like-1",
    "postId": "uuid-123",
    "profileId": "uuid-456",
    "profile": {
      "id": "uuid-456",
      "username": "joao123"
    }
  }
]
```

**Exemplo de uso (JavaScript/TypeScript):**

```typescript
const getLikes = async (postId: string) => {
  const response = await fetch(`/posts/${postId}/likes`);
  return await response.json();
};
```

---

### 8. Deletar Post

Remove um post e todos os seus comentários e likes. Apenas o autor do post pode deletá-lo.

**Endpoint:** `DELETE /posts/:id`

**Autenticação:** Requerida

**Path Parameters:**

- `id`: ID do post

**Response (200):**

```json
{
  "affected": 1
}
```

**Exemplo de uso (JavaScript/TypeScript):**

```typescript
const deletePost = async (postId: string) => {
  const response = await fetch(`/posts/${postId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${firebaseToken}`,
    },
  });

  return await response.json();
};
```

---

## Tipos TypeScript

Para facilitar o desenvolvimento frontend, aqui estão as interfaces TypeScript recomendadas:

```typescript
interface Profile {
  id: string;
  username: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  profile: Profile;
  comments?: Comment[];
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  profile: Profile;
  replies?: Comment[];
}

interface Like {
  id: string;
  postId: string;
  profileId: string;
  profile: Profile;
}

interface LikeAction {
  value: boolean;
  message: string;
}

interface CreatePostRequest {
  title: string;
  content: string;
}

interface CreateCommentRequest {
  content: string;
  parentCommentId?: string;
}
```

## Códigos de Status HTTP

- **200 OK**: Operação realizada com sucesso
- **201 Created**: Recurso criado com sucesso
- **400 Bad Request**: Dados inválidos na requisição
- **401 Unauthorized**: Token de autenticação inválido ou ausente
- **403 Forbidden**: Usuário não tem permissão para a operação
- **404 Not Found**: Recurso não encontrado
- **500 Internal Server Error**: Erro interno do servidor

## Tratamento de Erros

Exemplo de resposta de erro:

```json
{
  "message": "Post não encontrado",
  "error": "Not Found",
  "statusCode": 404
}
```

## Regras de Negócio

1. **Posts**:

   - Apenas usuários autenticados podem criar posts
   - Apenas o autor pode deletar seus próprios posts
   - Títulos e conteúdos são obrigatórios

2. **Comentários**:

   - Apenas usuários autenticados podem comentar
   - Suporte a comentários aninhados (respostas)
   - Não há limite de profundidade para respostas

3. **Likes**:

   - Apenas usuários autenticados podem curtir
   - Um usuário pode curtir apenas uma vez por post
   - Curtir novamente remove o like

4. **Paginação**:
   - A listagem de posts prioriza o último post do usuário autenticado
   - Posts próprios criados nos últimos 30 minutos aparecem primeiro

## Exemplo de Implementação Frontend (React)

```typescript
import { useState, useEffect } from 'react';

const ForumComponent = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await getPosts();
      setPosts(data);
    } catch (error) {
      console.error('Erro ao carregar posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const result = await toggleLike(postId);
      // Atualizar estado local
      setPosts(
        posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                likesCount: result.value
                  ? post.likesCount + 1
                  : post.likesCount - 1,
              }
            : post,
        ),
      );
    } catch (error) {
      console.error('Erro ao curtir post:', error);
    }
  };

  const handleComment = async (postId: string, content: string) => {
    try {
      await addComment(postId, content);
      // Recarregar comentários ou atualizar estado local
      loadPosts();
    } catch (error) {
      console.error('Erro ao comentar:', error);
    }
  };

  // Renderização do componente...
};
```

Esta API fornece todas as funcionalidades necessárias para implementar um sistema de fórum completo no frontend, incluindo criação de posts, sistema de comentários aninhados, likes e gerenciamento de conteúdo.
