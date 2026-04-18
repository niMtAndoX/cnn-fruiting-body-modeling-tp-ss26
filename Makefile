SHELL := /bin/sh

COMPOSE_FILE := ops/docker/docker-compose.yaml
COMPOSE_ENV := ops/docker/.env
DOCKER_COMPOSE := docker compose --env-file $(COMPOSE_ENV) -f $(COMPOSE_FILE)

PYTHON ?= python3.12
PNPM ?= pnpm

DEV_API_PORT ?= 8000
DEV_WEB_PORT ?= 4173
CHECK_API_PORT ?= 18000
CHECK_WEB_PORT ?= 14173
SCRIPT_ENV := PYTHON="$(PYTHON)" PNPM="$(PNPM)" DEV_API_PORT="$(DEV_API_PORT)" DEV_WEB_PORT="$(DEV_WEB_PORT)" CHECK_API_PORT="$(CHECK_API_PORT)" CHECK_WEB_PORT="$(CHECK_WEB_PORT)"
PROD_SCRIPT := ops/scripts/prod.sh
DEV_SCRIPT := ops/scripts/dev.sh
TEST_SCRIPT := ops/scripts/test.sh
BACKEND_SCRIPT := ops/scripts/backend.sh
FRONTEND_SCRIPT := ops/scripts/frontend.sh

.PHONY: test dev backend frontend deploy up down logs ps clean health

# Fuehrt lokal alle Backend- und Frontend-Tests sowie Linter aus.
test:
	@$(SCRIPT_ENV) sh $(TEST_SCRIPT)

# Installiert lokal alle Dependencies, baut Frontend und Backend und startet beide lokal.
dev:
	@$(SCRIPT_ENV) sh $(DEV_SCRIPT)

# Installiert das Backend lokal und startet den lokalen Backend-Server.
backend:
	@$(SCRIPT_ENV) sh $(BACKEND_SCRIPT)

# Installiert und baut das Frontend lokal und startet den lokalen Preview-Server.
frontend:
	@$(SCRIPT_ENV) sh $(FRONTEND_SCRIPT)

# Prueft Backend und Frontend lokal per Build und Healthcheck und deployed sie danach per Docker.
deploy:
	@$(SCRIPT_ENV) sh $(PROD_SCRIPT) deploy

# Startet den bestehenden Docker-Stack ohne Neu-Build im Hintergrund.
up:
	$(DOCKER_COMPOSE) up -d

# Stoppt den Docker-Stack und entfernt verwaiste Container.
down:
	$(DOCKER_COMPOSE) down --remove-orphans

# Zeigt die Logs des laufenden Docker-Stacks im Follow-Modus an.
logs:
	$(DOCKER_COMPOSE) logs -f

# Zeigt den Status der Docker-Container im Stack an.
ps:
	$(DOCKER_COMPOSE) ps

# Prueft den Health-Endpunkt des deployten Stacks ueber das Frontend-Gateway.
health:
	curl -fsS http://localhost:8080/api/v1/health

# Stoppt den Docker-Stack und entfernt zusaetzlich die zugehoerigen Volumes.
clean:
	$(DOCKER_COMPOSE) down --remove-orphans --volumes
