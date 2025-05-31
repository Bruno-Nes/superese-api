# Guia de Solução - Erro de Conexão com Banco de Dados no Render

## 🔍 Problema Identificado

```
ERROR [TypeOrmModule] Unable to connect to the database. Retrying (5)...
Error: getaddrinfo ENOTFOUND dpg-cv7msi5umphs73frdr5g-a
```

## ✅ Soluções Implementadas

### 1. Configuração Melhorada de Banco de Dados

- ✅ Criado `src/config/database.config.ts` com configurações otimizadas
- ✅ Configuração específica para produção vs desenvolvimento
- ✅ Retry attempts aumentados para 10 tentativas em produção
- ✅ Timeout configurado para 30 segundos
- ✅ Pool de conexões otimizado

### 2. Logs de Diagnóstico

- ✅ Adicionados logs no `main.ts` para verificar variáveis de ambiente
- ✅ Logs na configuração do banco para debug

### 3. Configuração SSL Adequada

- ✅ SSL habilitado apenas em produção
- ✅ `rejectUnauthorized: false` para aceitar certificados do Render

## 🔧 Próximos Passos para Verificar no Render

### 1. Verificar Variáveis de Ambiente

No painel do Render, certifique-se de que a variável `DATABASE_URL` está configurada:

```
DATABASE_URL=postgres://user:password@host:port/database?sslmode=require
```

### 2. URLs de Banco de Dados do Render

O Render fornece duas URLs diferentes:

- **Externa**: `dpg-xxxxx-a.oregon-postgres.render.com` (para acesso externo)
- **Interna**: `dpg-xxxxx-a` (para serviços dentro do Render)

**Recomendação**: Use a URL **EXTERNA** (completa) em `DATABASE_URL`.

### 3. Configurar NODE_ENV

Adicione a variável de ambiente:

```
NODE_ENV=production
```

### 4. Verificar Região do Banco

Certifique-se de que o banco de dados e a aplicação estão na mesma região do Render.

## 🚀 Deploy Commands para o Render

### Build Command:

```bash
npm install && npm run build
```

### Start Command:

```bash
npm run start:prod
```

## 🔍 Debug no Render

Para diagnosticar problemas, verifique os logs da aplicação no Render. Os logs agora mostrarão:

- Se a DATABASE_URL está configurada
- Configurações do banco de dados
- Tentativas de conexão

## 📋 Checklist de Verificação

- [ ] DATABASE_URL configurada no Render
- [ ] NODE_ENV=production configurada
- [ ] Usando URL externa do banco (com domínio completo)
- [ ] Banco e aplicação na mesma região
- [ ] SSL habilitado no banco PostgreSQL
- [ ] Firewall/rede permite conexões

## 🆘 Se o Problema Persistir

1. **Teste a conexão direta**:

   ```bash
   psql "DATABASE_URL_AQUI"
   ```

2. **Verifique se o banco está ativo** no painel do Render

3. **Tente recriar o banco** se necessário

4. **Considere usar a URL interna** se aplicação e banco estão no mesmo Render:
   - Substitua a URL externa pela interna nas variáveis de ambiente

## 📞 URLs Úteis

- [Render Database Docs](https://render.com/docs/databases)
- [PostgreSQL Connection Issues](https://render.com/docs/troubleshooting-deploys)
