Contexto do Projeto: Estou desenvolvendo uma plataforma que ajuda pessoas a superarem seus vícios. O projeto já possui funcionalidades implementadas como:
* Chat com IA (assistente que ajuda o usuário a lidar com emoções e cria planos personalizados com metas e práticas)
* Criação de planos/metas com base nas necessidades do usuário
* Diário pessoal com organização em pastas e anotações
* Fórum de interação estilo Reddit (postagens, curtidas, comentários)
* Sistema de amigos e chat privado entre usuários
O projeto backend foi desenvolvido com NestJS e utiliza TypeORM para acesso a dados. Agora preciso desenvolver a funcionalidade de Gamificação, que funcionará semelhante ao modulo de notificação, ou seja, receberá eventos de outros módulos, mas te tratando da gamificação quero especificamente:

🎯 Objetivo
Implementar um sistema de conquistas e medalhas no backend completamente funcional que:
* Registre o progresso do usuário baseado em ações que ele executa na plataforma
* Entregue feedbacks positivos e recompensas visuais(frontend, será implementado posteriormente)
* Exiba essas conquistas no perfil do usuário (para ele e para outros)
* Gatilhos automáticos baseados em padrões de uso (analisados por IA no futuro)

🧩 Categorias de Conquistas
Você precisa ter em mente que essa será a estrutura das conquistas, com categorias. Mas no momento inicial não será necessário a criação desse registro no banco, posteriormente iremos criar a lista de conquistas para popular o banco
1. Sociais
* Criar 5/10 conexões com outros usuários
* Comentar ou apoiar em 10/20/50 postagens do fórum
* Criar um post que tenha 10/50/100 curtidas
* Iniciar uma conversa com um novo amigo
2. Pessoais
* Concluir uma semana seguindo um plano da IA
* Realizar práticas sugeridas por 3/7/30 dias seguidos
* Escrever 10/50/100 entradas no diário
3. Metas/Planos (IA)
* Cumprir 100% de um plano sugerido pela IA
* Atingir todas as metas de uma semana/mês
* Criar uma meta pessoal e concluí-la
4. Geral
* Criar uma anotação com título e reflexão profunda
* Buscar ajuda em momento difícil usando o chat da IA

🏅 Recompensas e Visualização
* Cada conquista gera uma medalha com ilustração personalizada por categoria
* O usuário pode ver todas as medalhas conquistadas no seu perfil
* Outros usuários também podem visualizar as medalhas conquistadas ao visitar o perfil de alguém
* Cada medalha tem:
    * Nome
    * Descrição
    * Categoria
    * Data da conquista
    * Ilustração associada(pode ser um enum ou flag para o que o front mostre o icone relacionado)

🔁 Mecânica de Progresso e Feedback
* Notificações automáticas ao atingir 10%, 50% e 100% de progresso em uma conquista
* Mensagens como: “Você está no caminho certo!”
* Animação simples ao desbloquear uma conquista (registrar flag para o frontend renderizar)

⚙️ Requisitos Técnicos
* Criar estrutura de entidades TypeORM para:
    * Conquistas (templates)
    * Medalhas
    * Progresso do usuário em conquistas
* Criar serviços NestJS para:
    * Monitorar eventos na plataforma (criação de posts, diário, metas etc.), alguns desse eventos já existem para integração com o módulo de notificação
    * Atualizar o progresso do usuário
    * Marcar uma conquista como concluída e gerar a medalha
    * Emitir notificações e retornos para o frontend
* API para:
    * Listar conquistas disponíveis
    * Ver progresso individual
    * Listar medalhas do usuário
    * Compartilhar medalhas no feed (se desejar)

🎁 Extras (caso deseje implementar)
* Sistema de níveis ou XP vinculado à quantidade de medalhas

✅ Saída esperada:
* Estrutura de banco (entidades TypeORM)
* Services, DTOs e Controllers NestJS para gerenciar progresso e conquistas
* Eventos ou escuta de ações do sistema (usar event bus ou pattern observer se necessário)