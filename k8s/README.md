# Kubernetes Deployment for Auth-Next Project

This directory contains Kubernetes manifests to deploy the Next.js application using Minikube.

## Prerequisites

- Docker installed
- kubectl installed
- Minikube installed
- A Docker registry account (e.g., Docker Hub)

## Steps

1. **Build and Push Docker Image**

   ```bash
   docker build -t yourusername/auth-next:latest .
   docker push yourusername/auth-next:latest
   ```

   Replace `yourusername` with your Docker Hub username.

2. **Update Manifests**

   - In `deployment.yaml`, replace `yourusername/auth-next:latest` with your Docker image name.
   - The `secret.yaml` and `configmap.yaml` have been updated with your .env values.
   - BETTER_AUTH_URL and NEXT_PUBLIC_BETTER_AUTH_URL are set to the K8s service URL.

3. **Start Minikube**

   ```bash
   minikube start
   ```

4. **Deploy MongoDB (Optional)**

   If you want to deploy MongoDB in-cluster instead of using external:

   ```bash
   helm repo add bitnami https://charts.bitnami.com/bitnami
   helm install mongodb bitnami/mongodb --set auth.enabled=false
   ```

   Then update `MONGODB_URI` in secret to `mongodb://mongodb:27017/auth_next`.

5. **Apply Manifests**

   ```bash
   kubectl apply -f configmap.yaml
   kubectl apply -f secret.yaml
   kubectl apply -f deployment.yaml
   kubectl apply -f service.yaml
   ```

6. **Check Deployment**

   ```bash
   kubectl get pods
   kubectl get services
   ```

7. **Access the Application**

   - For local access: `minikube service auth-next-service`
   - Or port-forward: `kubectl port-forward svc/auth-next-service 3000:3000`

8. **Clean Up**

   ```bash
   kubectl delete -f .
   minikube stop
   ```

## Notes

- For production, use proper secrets management (e.g., Sealed Secrets).
- Add Ingress for external access if needed.
- Scale replicas in deployment.yaml as required.
- Ensure MongoDB is accessible from the cluster.
