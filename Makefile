#!make

# variables ----
	SERVICE_NAME := club-manager-auto-deploy
	PROJECT := club-manager-305511
  DOCKER_FILE_PATH := docker/docker-compose.yaml

# docker -------
buildup:
	docker-compose -f $(DOCKER_FILE_PATH) up -d --build
:
	docker-compose -f $(DOCKER_FILE_PATH) up -d
down:
	docker-compose -f $(DOCKER_FILE_PATH) down
down-v:
	docker-compose -f $(DOCKER_FILE_PATH) down -v
down-all:
	docker-compose -f $(DOCKER_FILE_PATH)  down --rmi all --volumes --remove-orphans
ps:
	docker-compose -f $(DOCKER_FILE_PATH) ps
restart:
	docker-compose -f $(DOCKER_FILE_PATH) restart
logs:
	docker-compose -f $(DOCKER_FILE_PATH) logs $(arg)
logs-tail:
	docker-compose -f $(DOCKER_FILE_PATH) logs -f --tail=500 $(arg)
config:
	docker-compose -f $(DOCKER_FILE_PATH) config

# gcloud for building on local
deploy:
	export PROJECT=$(PROJECT)
	gcloud builds submit \
  --project="$(PROJECT)" \
  --config cloudbuild.yaml
open:
	open https://console.cloud.google.com/run?hl=ja&project=$(PROJECT)
