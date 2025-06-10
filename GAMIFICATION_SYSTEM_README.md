# 🎮 Superese API - Sistema de Gamificação (Conquistas e Medalhas)

## 📋 Visão Geral

Este sistema de gamificação implementa um conjunto completo de conquistas e medalhas baseadas nas ações dos usuários em toda a plataforma Superese. O sistema monitora eventos de outros módulos (fórum, planejador, diário, chat, consultas IA) para rastrear o progresso do usuário e fornecer feedback através de notificações e recompensas visuais.

## 🏗️ Arquitetura do Sistema

### Entidades do Banco de Dados

#### `Achievement` (Conquistas)

Template do sistema com categorias e tipos para diferentes tipos de conquistas:

- **Categorias**: Social, Pessoal, Metas/Planos, Geral
- **Tipos**: Interações no fórum, conexões de amigos, entradas no diário, etc.
- **Campos**: nome, descrição, categoria, tipo, valor alvo, chave do ícone

#### `UserAchievement` (Medalhas do Usuário)

Rastrea conquistas desbloqueadas com flags de animação para o frontend:

- **Relacionamentos**: Perfil do usuário ↔ Conquista
- **Campos**: data de desbloqueio, flag "nova medalha" para animações

#### `UserProgress` (Progresso do Usuário)

Monitora progresso do usuário em direção às conquistas:

- **Marcos de notificação**: 10%, 50%, 100%
- **Campos**: valor atual, última notificação enviada

### Serviços Principais

#### `AchievementsService`

Serviço central com métodos para:

- Listar todas as conquistas e progresso do usuário
- Atualizar progresso e desbloquear conquistas
- Gerenciar marcos de notificação (10%, 50%, 100%)
- Gerenciar medalhas com flags de "nova medalha"

#### `AchievementSeederService`

Serviço para popular o banco de dados com conquistas iniciais:

- 40+ conquistas pré-definidas em 4 categorias
- Funcionalidade de seed e reseed
- Validação para evitar duplicatas

### Sistema de Eventos

#### `SystemEventsListener`

Captura eventos existentes do sistema:

- Curtidas em posts do fórum
- Comentários e respostas
- Aceitação de amizades
- Marcos de popularidade de posts

#### `AchievementListener`

Manipula eventos customizados de conquistas:

- Criação de posts no fórum
- Interações sociais
- Progresso em planos
- Entradas no diário
- Consultas à IA

#### `NotificationIntegrationListener`

Conecta desbloqueio de conquistas ao sistema de notificações:

- Notificações de conquistas desbloqueadas
- Notificações de progresso (marcos 10%, 50%)

## 📊 Tipos de Conquistas

### 🤝 Conquistas Sociais

- **Conexões de Amigos**: Primeira conexão → 10 conexões
- **Interações no Fórum**: Primeira interação → 50 interações
- **Posts Populares**: Posts com 10+ curtidas
- **Novas Conversas**: Primeiras conversas privadas

### 📝 Conquistas Pessoais

- **Entradas no Diário**: 1 entrada → 100 entradas
- **Reflexões Profundas**: Baseadas no conteúdo das entradas

### 🎯 Conquistas de Metas/Planos

- **Práticas Consecutivas**: 1 prática → 30 práticas
- **Conclusão de Planos**: 1 plano → 10 planos
- **Planos da IA**: Planos criados e concluídos com ajuda da IA

### 🌟 Conquistas Gerais

- **Busca por Ajuda da IA**: 1 consulta → 50 consultas
- **Reflexões Profundas**: Análise de conteúdo do diário

## 🔌 API Endpoints

### Conquistas Públicas

```http
GET /achievements
```

Lista todas as conquistas disponíveis

### Conquistas do Usuário

```http
GET /achievements/my-achievements
```

Lista conquistas desbloqueadas pelo usuário

### Progresso do Usuário

```http
GET /achievements/my-progress
```

Lista progresso em todas as conquistas

### Conquistas Públicas de Usuário

```http
GET /achievements/user/:userId/achievements
```

Lista conquistas de um usuário específico (perfil público)

### Contagem de Novas Medalhas

```http
GET /achievements/new-badges-count
```

Retorna número de medalhas não visualizadas

### Marcar Medalha como Vista

```http
PATCH /achievements/mark-badge-seen/:achievementId
```

Remove flag de "nova medalha"

### Seeding (Desenvolvimento)

```http
POST /achievements/seeder/seed
POST /achievements/seeder/reseed
```

Popular/repopular banco com conquistas

## 🔄 Fluxo de Eventos

### 1. Ação do Usuário

Usuário executa ação na plataforma (curtir post, escrever no diário, etc.)

### 2. Evento Emitido

Serviço relevante emite evento usando EventEmitter2

### 3. Listener Captura

SystemEventsListener ou AchievementListener captura o evento

### 4. Progresso Atualizado

AchievementsService atualiza progresso do usuário

### 5. Verificação de Conquista

Sistema verifica se usuário atingiu meta da conquista

### 6. Desbloqueio/Notificação

Se meta atingida: conquista desbloqueada + evento emitido para notificações

## 🎨 Integração Frontend

### Estrutura de Resposta - Conquista

```typescript
{
  id: string,
  name: string,
  description: string,
  category: 'social' | 'personal' | 'goals_plans' | 'general',
  type: string,
  targetValue: number,
  iconKey: string,
  currentProgress?: number,
  progressPercentage?: number,
  isCompleted?: boolean,
  unlockedAt?: Date
}
```

### Estrutura de Resposta - Medalha do Usuário

```typescript
{
  id: string,
  name: string,
  description: string,
  category: string,
  iconKey: string,
  unlockedAt: Date,
  hasNewBadge: boolean  // Para animações
}
```

### Chaves de Ícones

Cada conquista tem uma `iconKey` que o frontend pode usar para mapear ícones apropriados:

- `first_friend`, `social_circle`, `support_network`
- `first_interaction`, `active_participant`, `social_engager`
- `popular_post`, `content_creator`
- `first_entry`, `week_reflection`, `month_journey`
- etc.

## 🚀 Como Usar

### 1. Executar Migrações

Certifique-se de que as tabelas foram criadas:

```bash
npm run typeorm:run-migrations
```

### 2. Popular Conquistas

```bash
curl -X POST http://localhost:3000/achievements/seeder/seed
```

### 3. Testar Sistema

- Faça login na aplicação
- Execute ações (curtir posts, escrever no diário, etc.)
- Verifique conquistas em `/achievements/my-progress`
- Verifique medalhas desbloqueadas em `/achievements/my-achievements`

### 4. Integrar no Frontend

- Use as chaves de ícones para mostrar ícones apropriados
- Implemente animações para `hasNewBadge: true`
- Mostre barras de progresso usando `progressPercentage`
- Exiba notificações ao receber eventos de conquistas

## 📈 Marcos de Notificação

O sistema automaticamente envia notificações de progresso:

- **10%**: "Você está no caminho certo!"
- **50%**: "Você está na metade do caminho!"
- **100%**: "Conquista desbloqueada!"

## 🔧 Configuração de Desenvolvimento

### Adicionar Nova Conquista

1. Adicione entrada em `achievement-seeds.ts`
2. Execute reseed: `POST /achievements/seeder/reseed`
3. Implemente lógica de detecção de evento se necessário

### Adicionar Novo Tipo de Evento

1. Adicione enum em `AchievementType`
2. Crie listener apropriado
3. Emita evento do serviço relevante
4. Teste fluxo completo

## 📝 Logs e Debugging

O sistema inclui logging abrangente:

- Eventos capturados
- Progresso atualizado
- Conquistas desbloqueadas
- Erros e exceções

Use níveis de log apropriados para debugging:

```typescript
this.logger.debug('Debugging info');
this.logger.log('General info');
this.logger.warn('Warning');
this.logger.error('Error', error);
```

## 🔒 Considerações de Segurança

- Todos os endpoints usam autenticação Firebase
- IDs de usuário são validados antes de operações
- Progresso não pode ser reduzido (apenas incrementado)
- Conquistas não podem ser "des-desbloqueadas"

## 🧪 Testes

### Testar Conquistas Sociais

1. Faça login com 2 usuários
2. Usuário A cria post
3. Usuário B curte post
4. Verifique progresso de ambos

### Testar Conquistas Pessoais

1. Escreva entrada no diário
2. Verifique progresso em `diary_entries`
3. Escreva reflexão profunda
4. Verifique progresso em `deep_reflection`

### Testar Conquistas de Planos

1. Crie plano usando IA
2. Complete práticas diárias
3. Conclua plano
4. Verifique múltiplas conquistas desbloqueadas

## 📋 Lista de Conquistas Implementadas

### Sociais (9 conquistas)

- Primeiro Amigo, Círculo Social, Rede de Apoio
- Primeira Interação, Participante Ativo, Engajador Social
- Post Popular, Criador de Conteúdo
- Primeira Conversa

### Pessoais (4 conquistas)

- Primeiro Registro, Semana de Reflexão
- Mês de Jornada, Hábito de Escrita

### Metas/Planos (8 conquistas)

- Primeira Prática, Semana Consistente, Dedicação Constante
- Primeiro/3°/10° Plano Concluído
- Plano IA Concluído, Parceiro da IA

### Gerais (5 conquistas)

- Reflexão Profunda, Pensador Profundo
- Primeira Consulta IA, Usuário da IA, Colaborador da IA

**Total: 26 conquistas implementadas**

## 🎯 Próximos Passos

1. **Integração com Sistema de Notificações**: Conectar eventos de conquista com notificações push/email
2. **Sistema de Níveis/XP**: Adicionar sistema de experiência baseado em medalhas
3. **Conquistas Temporais**: Implementar conquistas baseadas em tempo (streaks diários, etc.)
4. **Conquistas Sociais Avançadas**: Baseadas em interações entre usuários específicos
5. **Analytics**: Dashboard para administradores visualizarem progresso dos usuários

## 📞 Suporte

Para questões sobre implementação ou bugs, verifique:

1. Logs do sistema para erros específicos
2. Status das migrações do banco de dados
3. Configuração dos event listeners
4. Autenticação Firebase funcionando

---

_Sistema de Gamificação Superese v1.0_
_Desenvolvido com NestJS, TypeORM e EventEmitter2_
