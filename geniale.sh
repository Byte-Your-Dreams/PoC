#!/bin/bash 
if [ -z "$1" ]; then 
    echo "Uso: $0 {up|down}" 
    exit 1 
fi

case "$1" in 
    up) 
        cd ./docker
        docker network create vimar_net
        docker-compose -f docker-compose.yml up -d 
        docker-compose -f docker-compose.app.yml up -d
        ;; 
    down)
        cd ./docker
        docker-compose -f docker-compose.app.yml down 
        docker-compose -f docker-compose.yml down
        docker network rm vimar_net

        ;;
    *) 
        echo "Uso: $0 {up|down}" 
        exit 1 
        ;; 
esac