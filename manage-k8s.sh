#!/bin/bash
export KUBECONFIG=/root/.kube/config

# DigiShop K8s Helper Management Script

function show_help() {
    echo "Usage: ./manage-k8s.sh [command] [args]"
    echo ""
    echo "Commands:"
    echo "  up-prod          Deploy/Update Production-like environment (namespace default)"
    echo "  up-dev [name]    Deploy/Update a new feature environment (e.g. ./manage-k8s.sh up-dev barcode-feature)"
    echo "  status           Show status of all DigiShop pods"
    echo "  logs [app|db]    Watch logs for app or database"
    echo "  clean-dev [name] Remove a development environment"
    echo "  db-shell         Enter Database shell (default namespace)"
    echo "  app-shell        Enter App shell (default namespace)"
}

case "$1" in
    up-prod)
        echo "Updating Production-like environment..."
        sudo skaffold run
        ;;
    up-dev)
        if [ -z "$2" ]; then
            echo "Error: Berikan nama fitur (contoh: ./manage-k8s.sh up-dev fitur-baru)"
            exit 1
        fi
        NS="digishop-dev-$2"
        echo "------------------------------------------"
        echo "Menyiapkan lingkungan eksperimen: $NS"
        echo "------------------------------------------"
        sudo kubectl create namespace $NS 2>/dev/null
        echo "Menjalankan Skaffold Dev... (Tekan Ctrl+C untuk berhenti)"
        sudo skaffold dev --namespace $NS --status-check=false
        ;;
    status)
        echo "Memeriksa status layanan DigiShop di semua namespace..."
        sudo kubectl get pods -A -l "app in (digishop, db, tunnel)"
        ;;
    logs)
        if [ "$2" == "db" ]; then
            sudo kubectl logs -f -l app=db
        else
            sudo kubectl logs -f -l app=digishop
        fi
        ;;
    clean-dev)
        if [ -z "$2" ]; then
            echo "Error: Provide feature name to delete"
            exit 1
        fi
        NS="digishop-dev-$2"
        echo "Deleting environment $NS..."
        sudo kubectl delete namespace $NS
        ;;
    db-shell)
        POD=$(sudo kubectl get pods -l app=db -o jsonpath="{.items[0].metadata.name}")
        sudo kubectl exec -it $POD -- psql -U postgres -d digishop
        ;;
    app-shell)
        POD=$(sudo kubectl get pods -l app=digishop -o jsonpath="{.items[0].metadata.name}")
        sudo kubectl exec -it $POD -- sh
        ;;
    *)
        show_help
        ;;
esac
