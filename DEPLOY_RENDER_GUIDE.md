# 🚀 Deploy da API Superese no Render - Guia Completo

## ✅ Correções Implementadas

### 1. **Configuração de Banco de Dados Otimizada**

- ✅ Arquivo `src/config/database.config.ts` criado com configurações robustas
- ✅ Retry attempts: 10 tentativas em produção (vs 3 em desenvolvimento)
- ✅ Timeout: 30 segundos para conexões
- ✅ SSL configurado automaticamente baseado no ambiente
- ✅ Pool de conexões otimizado para produção

### 2. **Logs de Diagnóstico Melhorados**

- ✅ Logs no `main.ts` para verificar variáveis de ambiente
- ✅ Logs de configuração do banco para debug
- ✅ Porta dinâmica baseada em `process.env.PORT`

### 3. **Build Corrigido**

- ✅ Erro de sintaxe no `main.ts` corrigido
- ✅ Compilação TypeScript funcionando

## 🔧 Configuração no Render

### 1. **Variáveis de Ambiente Obrigatórias**

Configure estas variáveis no painel do Render:

```bash
DATABASE_URL=postgres://user:password@dpg-xxxxx-a.oregon-postgres.render.com:5432/database?sslmode=require
NODE_ENV=production
JWT_SECRET_KEY=seu_jwt_secret_aqui
PORT=10000
```

### 2. **Comandos de Build e Start**

**Build Command (Recomendado):**

```bash
npm ci && npm run build
```

**Build Command (Alternativo se houver problemas):**

```bash
npm install --legacy-peer-deps && npm run build
```

**Start Command:**

```bash
npm run start:prod
```

### 3. **Verificar package.json**

Certifique-se de que o script `start:prod` existe:

```json
{
  "scripts": {
    "start:prod": "node dist/main"
  }
}
```

## 🔍 Troubleshooting - Problemas Comuns

### Problema 1: `getaddrinfo ENOTFOUND`

**Causa**: URL do banco incorreta ou interna sendo usada
**Solução**:

- Use a URL **EXTERNA** completa do banco PostgreSQL
- Formato: `postgres://user:pass@dpg-xxxxx-a.oregon-postgres.render.com:5432/db`
- ❌ Evite: `dpg-xxxxx-a` (URL interna)
- ✅ Use: `dpg-xxxxx-a.oregon-postgres.render.com` (URL externa)

### Problema 2: SSL Connection Error

**Causa**: Configuração SSL inadequada
**Solução**: A configuração já está correta no código:

```typescript
ssl: isProduction ? { rejectUnauthorized: false } : false;
```

### Problema 3: Connection Timeout

**Causa**: Timeout muito baixo ou região diferente
**Solução**:

- Configuração já otimizada para 30s timeout
- Verifique se banco e app estão na mesma região

## 📋 Checklist de Deploy

### Antes do Deploy:

- [ ] `DATABASE_URL` configurada (URL externa completa)
- [ ] `NODE_ENV=production` configurada
- [ ] `JWT_SECRET_KEY` configurada
- [ ] Banco PostgreSQL ativo no Render
- [ ] Mesma região para banco e aplicação

### Durante o Deploy:

- [ ] Build command: `npm install && npm run build`
- [ ] Start command: `npm run start:prod`
- [ ] Verificar logs de inicialização

### Após o Deploy:

- [ ] Aplicação iniciou sem erros
- [ ] Logs mostram: "Application is running on port XXXX"
- [ ] Logs mostram: "Database configuration" com sucesso
- [ ] Endpoint `/v1/api/docs` acessível (Swagger)

## 🔗 URLs Importantes

Após o deploy bem-sucedido:

- **API Base**: `https://your-app.onrender.com/v1`
- **Swagger Docs**: `https://your-app.onrender.com/v1/api/docs`
- **Forum API**: `https://your-app.onrender.com/v1/posts`

## 🛠️ Scripts de Verificação Local

### Testar Build:

```bash
npm run build
```

### Testar Start (simular produção):

```bash
NODE_ENV=production npm run start:prod
```

### Verificar Logs:

Os logs agora mostrarão:

```
Starting application...
DATABASE_URL: Set
NODE_ENV: production
Database configuration: { isProduction: true, hasUrl: true, urlStart: 'postgres://...' }
Application is running on port 10000
```

## 🚨 Se Problemas Persistirem

1. **Verifique os logs do Render** para erros específicos
2. **Teste a URL do banco diretamente**:
   ```bash
   psql "DATABASE_URL_COMPLETA_AQUI"
   ```
3. **Considere recriar o banco** se houver problemas de rede
4. **Verifique se o firewall permite conexões** na porta 5432

## 📞 Suporte

- Documentação do Render: https://render.com/docs/databases
- Se precisar de ajuda adicional, verifique os logs específicos do erro

---

**Resumo**: A aplicação agora está configurada de forma robusta para deploy no Render, com configurações otimizadas de banco de dados, retry logic adequada e logs de diagnóstico para facilitar troubleshooting.
