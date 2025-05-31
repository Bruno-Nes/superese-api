# API Planner - Documentação Completa

## Visão Geral

O módulo Planner permite aos usuários criar, gerenciar e acompanhar planos de recuperação com metas específicas. Cada plano tem uma duração definida, progresso rastreável e metas associadas.

## Autenticação

Todas as rotas requerem autenticação via Firebase JWT Token.

```
Headers:
Authorization: Bearer <firebase-jwt-token>
```

## Endpoints

### 1. Criar Plano

**POST** `/planner`

Cria um novo plano com metas associadas para o usuário autenticado.

**Request Body:**

```typescript
{
  description: string;    // Descrição do plano
  duration: number;       // Duração em dias/semanas
  goals: string[];        // Array de descrições das metas
}
```

**Exemplo de Request:**

```json
{
  "description": "Plano de 30 dias para redução de apostas",
  "duration": 30,
  "goals": [
    "Não apostar por 1 semana",
    "Encontrar uma atividade substituta",
    "Conversar com um amigo sobre o progresso"
  ]
}
```

**Response:**

```typescript
{
  id: string;
  description: string;
  duration: number;
  progress: number; // Sempre 0 para novos planos
  completed: boolean; // Sempre false para novos planos
  profile: Profile;
}
```

**Status Codes:**

- `201 Created` - Plano criado com sucesso
- `404 Not Found` - Perfil do usuário não encontrado
- `400 Bad Request` - Dados inválidos

---

### 2. Listar Planos do Usuário

**GET** `/planner`

Retorna todos os planos do usuário autenticado com suas metas.

**Response:**

```typescript
[
  {
    id: string;
    description: string;
    duration: number;
    progress: number;
    completed: boolean;
    goals: [
      {
        id: string;
        description: string;
      }
    ]
  }
]
```

**Status Codes:**

- `200 OK` - Lista retornada com sucesso
- `404 Not Found` - Perfil do usuário não encontrado

---

### 3. Aumentar Progresso

**PATCH** `/planner/:planId/increase`

Incrementa o progresso do plano em 1. Se o progresso atingir a duração, marca o plano como completo.

**Parâmetros:**

- `planId` (string) - ID do plano

**Response:**

```json
// Status 200 sem body de resposta
```

**Status Codes:**

- `200 OK` - Progresso atualizado
- `404 Not Found` - Plano não encontrado

---

### 4. Diminuir Progresso

**PATCH** `/planner/:planId/decrease`

Decrementa o progresso do plano em 1. Se o plano estava completo, remove a marca de completo. O progresso não pode ser menor que 0.

**Parâmetros:**

- `planId` (string) - ID do plano

**Response:**

```json
// Status 200 sem body de resposta
```

**Status Codes:**

- `200 OK` - Progresso atualizado
- `404 Not Found` - Plano não encontrado

---

### 5. Deletar Plano

**DELETE** `/planner/:planId`

Deleta um plano e todas as suas metas associadas. Apenas o proprietário do plano pode deletá-lo.

**Parâmetros:**

- `planId` (string) - ID do plano

**Response:**

```typescript
{
  success: boolean;
  message: string;
}
```

**Exemplo de Response:**

```json
{
  "success": true,
  "message": "Plan and its goals deleted successfully"
}
```

**Status Codes:**

- `200 OK` - Plano deletado com sucesso
- `404 Not Found` - Plano não encontrado ou não pertence ao usuário
- `404 Not Found` - Perfil do usuário não encontrado

---

## Modelos de Dados

### CreatePlanDTO

```typescript
{
  description: string;    // Obrigatório
  duration: number;       // Obrigatório, número positivo
  goals: string[];        // Obrigatório, array não vazio
}
```

### PlanResponseDTO

```typescript
{
  id: string;
  description: string;
  duration: number;
  progress: number;
  completed: boolean;
  goals: GoalResponseDTO[];
}
```

### GoalResponseDTO

```typescript
{
  id: string;
  description: string;
}
```

### DeletePlanResponseDTO

```typescript
{
  success: boolean;
  message: string;
}
```

## Regras de Negócio

1. **Progresso**:

   - Inicia sempre em 0
   - Não pode ser menor que 0
   - Quando atinge a duração, o plano é marcado como completo

2. **Completion**:

   - Plano é automaticamente marcado como completo quando progress === duration
   - Ao diminuir progresso de um plano completo, ele é desmarcado como completo

3. **Metas**:

   - São criadas junto com o plano
   - São deletadas automaticamente quando o plano é deletado (cascade)
   - Não podem ser editadas individualmente (por enquanto)

4. **Propriedade**:
   - Usuários só podem ver/editar/deletar seus próprios planos
   - A verificação é feita via firebaseUid

## Códigos de Erro Comuns

```json
// 404 - Perfil não encontrado
{
  "statusCode": 404,
  "message": "Profile not found!",
  "error": "Not Found"
}

// 404 - Plano não encontrado
{
  "statusCode": 404,
  "message": "Plan not found or does not belong to this user!",
  "error": "Not Found"
}

// 400 - Dados inválidos
{
  "statusCode": 400,
  "message": "Goal must be a string",
  "error": "Bad Request"
}
```

## Exemplos de Uso (Frontend)

### Criar Plano

```javascript
const createPlan = async (planData) => {
  const response = await fetch('/api/planner', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${firebaseToken}`,
    },
    body: JSON.stringify(planData),
  });
  return response.json();
};
```

### Listar Planos

```javascript
const getPlans = async () => {
  const response = await fetch('/api/planner', {
    headers: {
      Authorization: `Bearer ${firebaseToken}`,
    },
  });
  return response.json();
};
```

### Aumentar Progresso

```javascript
const increaseProgress = async (planId) => {
  await fetch(`/api/planner/${planId}/increase`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${firebaseToken}`,
    },
  });
};
```

### Deletar Plano

```javascript
const deletePlan = async (planId) => {
  const response = await fetch(`/api/planner/${planId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${firebaseToken}`,
    },
  });
  return response.json();
};
```

## Status da Implementação

✅ **Completo:**

- Criar plano com metas
- Listar planos do usuário
- Aumentar/diminuir progresso
- Deletar plano e metas
- Validação de propriedade
- Tratamento de erros

🔄 **Futuras Melhorias:**

- Editar plano existente
- Editar metas individuais
- Histórico de progresso
- Notificações de marcos
- Estatísticas de progresso
- Compartilhamento de planos
