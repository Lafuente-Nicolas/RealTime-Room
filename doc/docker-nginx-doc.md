#  Documentation Docker & Nginx 

##  1. C'est quoi Docker ?

Docker permet d'exécuter une application dans un **conteneur isolé**. Un
conteneur contient : - le code - les dépendances - la config système -
la version de Node

 Résultat :\
L'application marche **pareil sur ton PC, sur Render, ou ailleurs**.

------------------------------------------------------------------------

## 2. Image vs Conteneur

**Image Docker** = recette de cuisine\
→ contient tout pour lancer l'app

**Conteneur Docker** = le plat cuisiné\
→ instance en train de tourner

------------------------------------------------------------------------

## 3. Dockerfile (API)

Exemple :

FROM node:20-alpine\
WORKDIR /app\
COPY package\*.json ./\
RUN npm install\
COPY . .\
CMD \["node","index.js"\]

Ce fichier dit à Docker : 1. utilise Node 20 2. copie le projet 3.
installe les dépendances 4. lance l'API

------------------------------------------------------------------------

## 4. Dockerfile (Frontend + Nginx)

On utilise **2 étapes** :

1.  build Vite
2.  servir les fichiers avec Nginx

FROM node:20-alpine as build\
WORKDIR /app\
COPY . .\
RUN npm install && npm run build

FROM nginx:alpine\
COPY nginx.conf /etc/nginx/conf.d/default.conf\
COPY --from=build /app/dist /usr/share/nginx/html

 Node sert à construire le site\
 Nginx sert à le montrer au navigateur

------------------------------------------------------------------------

## 5. Rôle de Nginx

Nginx est un **serveur web**.

Il peut : - servir le front - rediriger vers l'API - gérer les routes
SPA - agir comme reverse proxy

Exemple :

location /api/ { proxy_pass http://api:3000/; }

 Quand le front appelle `/api/...`  Nginx envoie la requête vers
l'API Docker

------------------------------------------------------------------------

## 6. docker-compose

Compose permet de lancer **plusieurs conteneurs ensemble**.

Exemple :

services: api: build: ./api ports: - "3000:3000"

web: build: ./web ports: - "8080:80" depends_on: - api

 Une seule commande :

docker compose up --build

→ lance API + Nginx + Front

------------------------------------------------------------------------

## 7. Déploiement sur Render

Render lit le fichier `render.yaml`.

Il : 1. clone ton repo 2. build l'image Docker 3. démarre le conteneur
4. vérifie `/health`

 Si `/health` répond → service OK

------------------------------------------------------------------------

## 8. Ce que tu as appris avec ce projet

-   créer un Dockerfile Node
-   créer un Dockerfile Nginx
-   builder un front Vite en prod
-   connecter Nginx à une API
-   déployer une image Docker sur Render
-   comprendre la différence dev / prod

 Ça correspond exactement à un workflow pro.

------------------------------------------------------------------------

# Conclusion

Docker permet : - de figer ton environnement - d'éviter les bugs "ça
marche chez moi" - de déployer partout pareil

Nginx permet : - de servir le front - de connecter le front à l'API -
d'optimiser les performances

 Ensemble, ils forment la base du déploiement web moderne.
