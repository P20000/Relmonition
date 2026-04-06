# Relmonition Backend
<img width="1057" height="630" alt="image" src="https://github.com/user-attachments/assets/59a5c4ac-3638-41a4-b8cb-793cd7749c39" />

## Overview
Relmonition is a secure, HIPAA-eligible, multi-tenant backend architecture designed for relationship wellness. It utilizes a **"Namespace-per-Couple"** isolation model to ensure strict data sovereignty and compliance.

## Architecture
This system is built for scale and security:
- **Language**: TypeScript (Node.js/Express)
- **Database**: Per-tenant Turso (SQLite) databases
- **Infrastructure**: AWS EKS (Kubernetes) managed via Terraform
- **Deployment**: Helm charts for isolated tenant scaling
- **Automation**: One-click CI/CD via `deploy.sh`

## Prerequisites
Before deploying, ensure you have the following installed:
- [AWS CLI](https://aws.amazon.com/cli/) (configured with `aws configure`)
- [Terraform](https://www.terraform.io/)
- [Docker](https://www.docker.com/)
- [Helm](https://helm.sh/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)

## Getting Started

### Local Development
To run the server locally during development:
```bash
cd server
npm install
npm run dev
```

### Production Deployment
We use a "God Script" to orchestrate the entire deployment pipeline. This script handles:
1. Provisioning AWS Infrastructure (Terraform)
2. Building and Pushing Docker images to ECR
3. Deploying/Updating isolated tenant namespaces via Helm

**To go live:**
```bash
chmod +x deploy.sh
./deploy.sh
```

## Security & Compliance
- **Data Isolation**: Every couple is provisioned into their own Kubernetes Namespace with strict `NetworkPolicies` preventing cross-tenant traffic.
- **Data Residency**: Turso databases are provisioned per-tenant to satisfy data residency requirements.
- **Secrets Management**: Sensitive credentials should be managed via AWS Secrets Manager and the External Secrets Operator. **Never commit secrets to git.**

## Project Structure
- `/server`: Core Node.js/TypeScript application code.
- `/terraform`: AWS infrastructure definitions (VPC, EKS).
- `/charts`: Helm templates for dynamic tenant provisioning.
- `/k8s`: Kubernetes base manifests for deployment.

---
*Built for production scale. For internal use only.*
