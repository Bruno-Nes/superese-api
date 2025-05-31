# Dockerfile ultra-otimizado para produção
FROM node:20.12.2-alpine

# Instalar dependências essenciais e criar usuário em uma única camada
RUN apk add --no-cache --update dumb-init curl && \
    apk upgrade && \
    npm config set legacy-peer-deps true && \
    npm config set fund false && \
    npm config set audit false && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Definir variáveis de ambiente otimizadas
ENV NODE_ENV=production \
    PORT=3000 \
    NODE_OPTIONS="--max-old-space-size=512"

WORKDIR /app

# Copiar arquivos de configuração
COPY package*.json ./

# Instalar dependências (incluindo dev para build)
RUN npm ci --include=dev --silent && npm cache clean --force

# Copiar código fonte
COPY tsconfig*.json ./
COPY src ./src

# Build da aplicação e limpeza em uma única camada
RUN npm run build && \
    npm prune --production && \
    rm -rf src tsconfig*.json node_modules/.cache /tmp/* /var/tmp/* && \
    npm cache clean --force

# Configurar permissões e usuário
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expor porta
EXPOSE $PORT

# Health check simplificado
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:$PORT/v1/health || exit 1

# Comando otimizado para produção
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
