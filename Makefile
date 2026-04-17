COMPOSE_FILE := ops/docker/docker-compose.yaml
COMPOSE_ENV := ops/docker/.env
DOCKER_COMPOSE := docker compose --env-file $(COMPOSE_ENV) -f $(COMPOSE_FILE)

.PHONY: deploy up down restart build logs ps clean health

deploy:
	$(DOCKER_COMPOSE) up -d --build

up:
	$(DOCKER_COMPOSE) up -d

down:
	$(DOCKER_COMPOSE) down --remove-orphans

restart:
	$(DOCKER_COMPOSE) down --remove-orphans
	$(DOCKER_COMPOSE) up -d --build

build:
	$(DOCKER_COMPOSE) build

logs:
	$(DOCKER_COMPOSE) logs -f

ps:
	$(DOCKER_COMPOSE) ps

health:
	curl -fsS http://localhost:8080/api/v1/health

clean:
	$(DOCKER_COMPOSE) down --remove-orphans --volumes
