# Azure Deployment Guide for kon-cloud

This directory contains the Infrastructure as Code (Bicep), Docker Compose configuration, and deployment script to deploy the **kon-cloud** application onto Microsoft Azure.

---

## Architecture Summary

```
                                  ┌────────────────────────────────────────────────────────┐
                                  │                Azure Resource Group                    │
                                  │                                                        │
┌──────────────┐                  │  ┌──────────────────────────────────────────────────┐  │
│  Client      ├──────────────────┼─►│ Azure App Service (Web App for Containers)       │  │
│  Browser     │                  │  │                                                  │  │
└──────────────┘                  │  │  ┌────────────────────┐ ┌─────────────────────┐  │  │
                                  │  │  │ frontend container │ │  backend container  │  │  │
                                  │  │  │ (port 80)          │ │  (port 3000)        │  │  │
                                  │  │  └────────────────────┘ └──────────┬──────────┘  │  │
                                  │  └────────────────────────────────────┼─────────────┘  │
                                  │                                       │                │
                                  │            ┌──────────────────────────┼──────────────┐ │
                                  │            ▼                          ▼              │ │
                                  │  ┌───────────────────┐     ┌──────────────────────┐  │ │
                                  │  │ Azure SQL Server  │     │ Azure Storage        │  │ │
                                  │  │ (Database: kon)   │     │ (Blob Container)     │  │ │
                                  │  └───────────────────┘     └──────────────────────┘  │ │
                                  └────────────────────────────────────────────────────────┘
```

The infrastructure provisions the following Azure resources:

1. **Azure App Service (Linux Multi-container)**:
   Runs the `backend` and `frontend` Docker images built from GHCR:
    - `ghcr.io/alfredojspera/kon-cloud/backend:latest`
    - `ghcr.io/alfredojspera/kon-cloud/frontend:latest`
2. **Azure SQL Database (SQL Server)**:
    - Server: `<app-prefix>-sql-<unique-id>.database.windows.net`
    - Database: `kon`
    - Configured with a firewall rule (`AllowAllWindowsAzureIps`) allowing App Service to connect seamlessly.
    - Prisma database migrations (`npm run db:deploy`) run automatically on backend container startup.
3. **Azure Blob Storage**:
    - Storage Account: `<app-prefix>st<unique-id>`
    - Blob Container: `expense-attachments` (used for uploading expense document receipts and attachments).

---

## Prerequisites

1. **Azure CLI (`az`)**: Installed on your system ([Installation Guide](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)).
2. **Active Azure Subscription**: With permissions to create Resource Groups, App Services, SQL Servers, and Storage Accounts.
3. **Container Images**: The images `ghcr.io/alfredojspera/kon-cloud/backend:latest` and `ghcr.io/alfredojspera/kon-cloud/frontend:latest` must be accessible.

---

## Quick Start Deployment

Deploy the entire infrastructure in a single command using the automated bash script:

```bash
chmod +x ./deploy/deploy.sh
./deploy/deploy.sh
```

The script will prompt you for an SQL Administrator password if not set in the environment, create the target Azure Resource Group, and execute the Bicep template.

---

## Deployment Customization

You can customize deployment parameters using environment variables or by passing them to `deploy.sh`:

```bash
RESOURCE_GROUP="rg-kon-cloud-prod" \
LOCATION="italynorth" \
APP_NAME_PREFIX="kon-cloud" \
SQL_ADMIN_USER="konadmin" \
SQL_ADMIN_PASSWORD="YourSecurePassword123!" \
./deploy/deploy.sh
```

### Deploying via Azure CLI directly

You can also trigger deployment directly using Azure CLI:

```bash
# 1. Create Resource Group
az group create --name rg-kon-cloud --location italynorth

# 2. Deploy Bicep template
az deployment group create \
  --resource-group rg-kon-cloud \
  --template-file deploy/main.bicep \
  --parameters \
    appNamePrefix='kon-cloud' \
    location='italynorth' \
    sqlAdminLogin='konadmin' \
    sqlAdminPassword='YourSecurePassword123!'
```

---

## Environment Variables & App Settings

The Bicep template automatically injects required environment variables into the Web App settings:

| Environment Variable              | Description / Value                                       |
| --------------------------------- | --------------------------------------------------------- |
| `DB_HOST`                         | Azure SQL Server FQDN (`<server>.database.windows.net`)   |
| `DB_PORT`                         | `1433`                                                    |
| `DB_NAME`                         | `kon`                                                     |
| `DB_USER`                         | SQL Admin Login                                           |
| `DB_PASSWORD`                     | SQL Admin Password                                        |
| `DB_ENCRYPT`                      | `true`                                                    |
| `DB_TRUST_SERVER_CERTIFICATE`     | `false`                                                   |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Blob Storage Connection String                      |
| `AZURE_STORAGE_CONTAINER_NAME`    | `expense-attachments`                                     |
| `ACCESS_TOKEN_SECRET`             | Secure JWT Access Token secret (generated automatically)  |
| `REFRESH_TOKEN_SECRET`            | Secure JWT Refresh Token secret (generated automatically) |
| `CSRF_TOKEN_SECRET`               | Secure CSRF secret (generated automatically)              |
| `FRONTEND_URL`                    | `https://<webapp-name>.azurewebsites.net`                 |
| `VITE_BACKEND_URL`                | `https://<webapp-name>.azurewebsites.net`                 |

---

## Verification & Troubleshooting

1. **Check Web App Deployment Logs**:
    ```bash
    az webapp log tail --name kon-cloud-app-<unique-id> --resource-group rg-kon-cloud
    ```
2. **Database Migrations**:
   The backend container automatically executes `npm run db:deploy` (Prisma migrations) upon boot. Ensure the database connection parameters are properly injected.
3. **Container Pull Issues**:
   If using private GHCR images, configure container registry credentials in Azure App Service under Deployment Center / Container settings.
