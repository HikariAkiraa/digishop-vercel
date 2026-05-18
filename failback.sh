#!/bin/bash
set -e

echo ">> 1. Pastikan db & app hidup di server 1..."
kubectl scale deploy digishop-db --replicas=1
kubectl wait --for=condition=ready pod -l app=db --timeout=120s
kubectl scale deploy digishop-app --replicas=2
kubectl wait --for=condition=ready pod -l app=digishop --timeout=120s

echo ">> 2. Restore DB dari /tmp/latest.sql.gz..."
POD=$(kubectl get pod -l app=db -o jsonpath='{.items[0].metadata.name}')
gunzip -c /tmp/latest.sql.gz | kubectl exec -i $POD -- psql -U postgres digishop

echo ">> 3. Restore uploads..."
APP_POD=$(kubectl get pod -l app=digishop -o jsonpath='{.items[0].metadata.name}')
kubectl cp /tmp/latest-uploads.tar.gz $APP_POD:/tmp/latest-uploads.tar.gz
kubectl exec $APP_POD -- tar xzf /tmp/latest-uploads.tar.gz -C /

echo ">> DONE. Server 1 kembali aktif."
