SHELL := /bin/sh
.DEFAULT_GOAL := help

COMPOSE_FILE := ops/docker/docker-compose.yaml
COMPOSE_ENV := ops/docker/.env
COMPOSE_ENV_EXAMPLE := ops/docker/.env.example
DOCKER_COMPOSE := docker compose --env-file $(COMPOSE_ENV) -f $(COMPOSE_FILE)

PYTHON ?= python3.12
PNPM ?= pnpm

DEV_API_PORT ?= 8000
DEV_WEB_PORT ?= 4173
CHECK_API_PORT ?= 18000
CHECK_WEB_PORT ?= 14173
LOG_TAIL ?= 200

SCRIPT_ENV := \
	PYTHON="$(PYTHON)" \
	PNPM="$(PNPM)" \
	DEV_API_PORT="$(DEV_API_PORT)" \
	DEV_WEB_PORT="$(DEV_WEB_PORT)" \
	CHECK_API_PORT="$(CHECK_API_PORT)" \
	CHECK_WEB_PORT="$(CHECK_WEB_PORT)"

SCRIPT_DIR := ops/scripts
TEST_SCRIPT := $(SCRIPT_DIR)/test.sh
DEV_SCRIPT := $(SCRIPT_DIR)/dev.sh
BACKEND_SCRIPT := $(SCRIPT_DIR)/backend.sh
FRONTEND_SCRIPT := $(SCRIPT_DIR)/frontend.sh
DEPLOY_SCRIPT := $(SCRIPT_DIR)/deploy.sh

.PHONY: help compose-check test dev backend frontend deploy up down logs ps health clean

help:
	@printf '%s\n' \
		'Verfügbare Targets:' \
		'  make test      Führt lokal Backend- und Frontend-Tests sowie Linter aus.' \
		'  make dev       Installiert lokale Dependencies, baut das Frontend und startet Backend + Frontend.' \
		'  make backend   Installiert das Backend lokal und startet den lokalen Backend-Server.' \
		'  make frontend  Installiert und baut das Frontend lokal und startet den Preview-Server.' \
		'  make deploy    Validiert das Docker-Deployment, baut Images und startet den Stack per Docker Compose.' \
		'  make up        Startet den bestehenden Docker-Stack ohne Neu-Build im Hintergrund.' \
		'  make down      Stoppt den Docker-Stack und entfernt verwaiste Container.' \
		'  make logs      Zeigt die Docker-Logs im Follow-Modus an.' \
		'  make ps        Zeigt den Status aller Container im Compose-Projekt an.' \
		'  make health    Prüft den Health-Endpunkt des deployten Stacks.' \
		'  make clean     Stoppt den Docker-Stack und entfernt zusätzlich Volumes.'

compose-check:
	@if [ ! -f "$(COMPOSE_ENV)" ]; then \
		test -f "$(COMPOSE_ENV_EXAMPLE)" || { \
			echo "Compose-Env fehlt: $(COMPOSE_ENV)" >&2; \
			echo "Beispiel-Datei fehlt ebenfalls: $(COMPOSE_ENV_EXAMPLE)" >&2; \
			exit 1; \
		}; \
		cp "$(COMPOSE_ENV_EXAMPLE)" "$(COMPOSE_ENV)"; \
		echo "$(COMPOSE_ENV) wurde neu angelegt. Werte bei Bedarf prüfen."; \
	fi
	@$(DOCKER_COMPOSE) config -q

# Führt lokal alle Backend- und Frontend-Tests sowie Linter aus.
test:
	@$(SCRIPT_ENV) sh $(TEST_SCRIPT)

# Installiert lokal alle Dependencies, baut das Frontend und startet Frontend + Backend lokal.
dev:
	@$(SCRIPT_ENV) sh $(DEV_SCRIPT)

# Installiert das Backend lokal und startet den lokalen Backend-Server.
backend:
	@$(SCRIPT_ENV) sh $(BACKEND_SCRIPT)

# Installiert und baut das Frontend lokal und startet den lokalen Preview-Server.
frontend:
	@$(SCRIPT_ENV) sh $(FRONTEND_SCRIPT)

# Validiert das Docker-Deployment, baut Images und startet den Stack per Docker Compose.
deploy:
	@sh $(DEPLOY_SCRIPT)

# Startet den bestehenden Docker-Stack ohne Neu-Build im Hintergrund.
up: compose-check
	$(DOCKER_COMPOSE) up -d --remove-orphans

# Stoppt den Docker-Stack und entfernt verwaiste Container.
down: compose-check
	$(DOCKER_COMPOSE) down --remove-orphans

# Zeigt die Logs des laufenden Docker-Stacks im Follow-Modus an.
logs: compose-check
	$(DOCKER_COMPOSE) logs --follow --tail=$(LOG_TAIL)

# Zeigt den Status aller Docker-Container im Stack an.
ps: compose-check
	$(DOCKER_COMPOSE) ps --all

# Prüft den Health-Endpunkt des deployten Stacks über das Frontend-Gateway.
health: compose-check
	@$(DOCKER_COMPOSE) exec -T web wget -qO- http://127.0.0.1/api/v1/health

# Stoppt den Docker-Stack und entfernt zusätzlich die zugehörigen Volumes.
clean: compose-check
	$(DOCKER_COMPOSE) down --remove-orphans --volumes
