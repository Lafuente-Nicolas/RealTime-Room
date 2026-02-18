# RealTime Room

Petit projet d'application temps réel avec :

- Backend Node.js (API)
- Frontend web
- Reverse proxy Nginx
- Docker + Docker Compose

---

##  Structure

```
app/
├── api/ # serveur Node.js
├── web/ # frontend + config nginx
└── docker-compose.yml
```
##  Lancer le projet

Depuis le dossier `app` :

``` 
docker compose up --build
```

L'application démarre avec :

- API sur http://localhost:3000
- Front sur http://localhost:8080

---

##  Stopper le projet
```
docker compose down
```

##  Voir les containers
```
docker ps
```

##  Objectif du jour 1

Apprendre à :

- dockeriser une application fullstack
- utiliser Nginx comme reverse proxy
- lancer plusieurs services avec Docker Compos