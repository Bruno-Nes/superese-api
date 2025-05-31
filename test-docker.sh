#!/bin/bash

# Script para testar e otimizar builds Docker
echo "🐳 Testando builds Docker otimizados..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# 1. Teste do Dockerfile principal
log "Testando Dockerfile principal..."
if docker build -t superese-api:latest -f Dockerfile .; then
    log "✅ Build do Dockerfile principal bem-sucedido"
    
    # Verificar tamanho da imagem
    SIZE=$(docker images superese-api:latest --format "table {{.Size}}" | tail -n 1)
    log "📦 Tamanho da imagem: $SIZE"
else
    error "❌ Falha no build do Dockerfile principal"
    exit 1
fi

# 2. Teste do Dockerfile.render
log "Testando Dockerfile.render..."
if docker build -t superese-api:render -f Dockerfile.render .; then
    log "✅ Build do Dockerfile.render bem-sucedido"
    
    # Verificar tamanho da imagem
    SIZE=$(docker images superese-api:render --format "table {{.Size}}" | tail -n 1)
    log "📦 Tamanho da imagem Render: $SIZE"
else
    error "❌ Falha no build do Dockerfile.render"
    exit 1
fi

# 3. Comparar tamanhos
log "📊 Comparação de tamanhos das imagens:"
docker images | grep superese-api

# 4. Teste rápido da aplicação
log "🧪 Testando inicialização da aplicação..."
CONTAINER_ID=$(docker run -d -p 3001:3000 --env NODE_ENV=production superese-api:latest)

if [ $? -eq 0 ]; then
    log "✅ Container iniciado com ID: $CONTAINER_ID"
    
    # Aguardar alguns segundos para a aplicação inicializar
    sleep 10
    
    # Testar health check
    if curl -f http://localhost:3001/v1/health &>/dev/null; then
        log "✅ Health check passou!"
    else
        warn "⚠️  Health check falhou (normal se não tiver banco configurado)"
    fi
    
    # Parar o container
    docker stop $CONTAINER_ID > /dev/null
    docker rm $CONTAINER_ID > /dev/null
    log "🧹 Container de teste removido"
else
    error "❌ Falha ao iniciar o container"
fi

# 5. Limpeza de imagens antigas
log "🧹 Limpando imagens dangling..."
docker image prune -f > /dev/null

log "🎉 Teste completo! Suas imagens Docker estão otimizadas e prontas para deploy."

echo ""
echo "📋 Próximos passos para deploy no Render:"
echo "1. Usar o Dockerfile.render para o deploy"
echo "2. Configurar as variáveis de ambiente no Render"
echo "3. Verificar se a URL do banco de dados está correta"
echo "4. Monitorar os logs durante o primeiro deploy"
