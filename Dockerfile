# Étape 1: Build de l'application React
FROM node:18-alpine AS builder

# Métadonnées
LABEL maintainer="MiniMax Agent"
LABEL description="Frontend React pour JemaOS RDP"
LABEL version="1.0.0"

# Répertoire de travail
WORKDIR /app

# Installation de pnpm
RUN npm install -g pnpm

# Copie des fichiers de configuration
COPY package*.json pnpm-lock.yaml* ./

# Installation des dépendances
RUN pnpm install --frozen-lockfile

# Copie du code source
COPY . .

# Variables d'environnement pour le build
ARG VITE_SERVER_URL=http://localhost:3001
ENV VITE_SERVER_URL=$VITE_SERVER_URL

# Build de production
RUN pnpm build

# Étape 2: Serveur nginx pour servir l'application
FROM nginx:alpine

# Installation de curl pour healthcheck
RUN apk add --no-cache curl

# Copie de la configuration nginx personnalisée
COPY nginx.conf /etc/nginx/nginx.conf

# Copie des fichiers buildés depuis l'étape précédente
COPY --from=builder /app/dist /usr/share/nginx/html

# Création d'un utilisateur non-root
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001 -G nginx

# Configuration des permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Création des répertoires nécessaires avec bonnes permissions
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Utilisation de l'utilisateur non-root
USER nginx

# Port d'exposition
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost || exit 1

# Commande de démarrage
CMD ["nginx", "-g", "daemon off;"]