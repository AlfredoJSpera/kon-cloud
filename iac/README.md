# Azure Infrastructure as Code (IaC) - Bicep

This directory contains the complete **Bicep** Infrastructure as Code (IaC) templates for deploying the **kon-cloud** application to Microsoft Azure according to the architecture specification.

---

## 📐 Architecture Overview

```
                          ┌────────────────────────────────────────────────────────┐
                          │ Resource Group                                         │
                          │                                                        │
┌──────────┐              │   ┌────────────────────────────────────────────────┐   │         ┌────────────────────┐
│          │              │   │ Azure Application Gateway (Standard_v2)        │   │         │                    │
│ Internet │──────────────┼──►│                                                │   │         │  Azure SQL Server  │
│          │              │   │   • /api/* ──► Backend Pool (Backend Web App)  ├───┼────────►│  & Database (kon)  │
└──────────┘              │   │   • /*     ──► Frontend Pool (Frontend Web App)│   │         │                    │
                          │   └────────────────────────────────────────────────┘   │         └────────────────────┘
                          │                           ▲                            │
                          │                           │ (API Calls)                │
                          │   ┌───────────────────────┴────────────────────────┐   │
                          │   │ App Service Plan (Linux)                       │   │
                          │   │  ┌──────────────────────────────────────────┐  │   │
                          │   │  │ Backend Web App                          │  │   │
                          │   │  │ (ghcr.io/.../backend:latest)             │  │   │
                          │   │  └──────────────────────────────────────────┘  │   │
                          │   │  ┌──────────────────────────────────────────┐  │   │
                          │   │  │ Frontend Web App                         │  │   │
                          │   │  │ (ghcr.io/.../frontend:latest)            │  │   │
                          │   │  └──────────────────────────────────────────┘  │   │
                          │   └────────────────────────────────────────────────┘   │
                          └────────────────────────────────────────────────────────┘
```

The infrastructure deploys:
- **Resource Group**: Scope container for all resources.
- **Virtual Network & Subnets**: Dedicated subnets for Application Gateway (`AppGatewaySubnet`) and App Services (`AppServiceSubnet`).
- **Standard Public IP**: IPv4 static public IP attached to the Application Gateway.
- **Azure Application Gateway (Standard_v2)**: Performs path-based HTTP routing:
  - `/api` and `/api/*` -> Backend App Service (`app-backend-*`).
  - Default `/` -> Frontend App Service (`app-frontend-*`).
- **Linux App Service Plan**: Hosts both containerized web apps.
- **Backend App Service**: Container image `ghcr.io/alfredojspera/kon-cloud/backend:latest` (Port `3000`).
- **Frontend App Service**: Container image `ghcr.io/alfredojspera/kon-cloud/frontend:latest` (Port `80`).
- **Azure SQL Database**: SQL Server with firewall rule enabling access for Azure services and database `kon`.

---

## 📁 Repository Structure

```
iac/
├── main.bicep               # Top-level main orchestration template
├── main.bicepparam          # Parameters configuration file
├── deploy.sh                # Deployment helper script
├── README.md                # This documentation
└── modules/
    ├── vnet.bicep           # Virtual Network, Subnets, and Public IP
    ├── sql.bicep            # Azure SQL Server, Database & Firewall rules
    ├── appservice.bicep     # App Service Plan & Web Apps for Containers
    └── appgateway.bicep     # Application Gateway v2 with path-based routing
```

---

## 🛠️ Prerequisites

1. **Azure CLI** installed ([Download Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)).
2. **Bicep CLI** installed (automatically installed with recent Azure CLI versions, or run `az bicep install`).
3. An active **Azure Subscription**.

---

## 🚀 How to Deploy

### Option 1: Using the Automated Deployment Script (Recommended)

Run the included shell script and pass your preferred region location:

```bash
cd iac
./deploy.sh -l <ALLOWED_REGION>
```

For example:
```bash
./deploy.sh -l northeurope
```
or
```bash
./deploy.sh -l italynorth
```

---

### Option 2: Manual Deployment via Azure CLI

#### 1. Log in to Azure

```bash
az login
```

#### 2. Create the Resource Group in an Allowed Azure Region

Replace `<ALLOWED_REGION>` with a region permitted by your Azure subscription policy (e.g. `northeurope`, `italynorth`, `eastus`):

```bash
az group create \
  --name rg-kon-cloud-prod \
  --location <ALLOWED_REGION>
```

#### 3. Deploy the Bicep Template

```bash
az deployment group create \
  --resource-group rg-kon-cloud-prod \
  --template-file iac/main.bicep \
  --parameters iac/main.bicepparam \
  --parameters location=<ALLOWED_REGION>
```

---

## ⚠️ Troubleshooting: `RequestDisallowedByAzure`

If you receive an error like:
> `Resource ... was disallowed by Azure: This policy maintains a set of best available regions where your subscription can deploy resources...`

This means your Azure subscription has an **Azure Policy** restricting deployments to specific allowed regions.

### How to Fix:

1. **Find Allowed Regions for your Azure Subscription**:
   Check your Azure subscription policy or list available locations:
   ```bash
   az account list-locations --query "[].{Name:name, DisplayName:displayName}" --output table
   ```

2. **Re-create your Resource Group in an allowed region**:
   ```bash
   az group create --name rg-kon-cloud-prod --location <allowed-region-name>
   ```

3. **Re-run the deployment passing the allowed region**:
   ```bash
   cd iac
   ./deploy.sh -l <allowed-region-name>
   ```

---

## ⚙️ Customizing Parameters (`main.bicepparam`)

You can edit `iac/main.bicepparam` to change default settings:

| Parameter | Type | Description | Default |
| :--- | :--- | :--- | :--- |
| `appName` | `string` | Application prefix | `'kon-cloud'` |
| `environment` | `string` | Deployment environment | `'prod'` |
| `appServicePlanSku` | `string` | App Service Plan SKU | `'B1'` |
| `sqlDatabaseSku` | `string` | Azure SQL Database SKU | `'S0'` |
| `sqlAdminUser` | `string` | SQL Server Admin Username | `'konadmin'` |
| `sqlAdminPassword` | `securestring` | SQL Server Admin Password | `'ComplexPassword123!'` |
| `backendImage` | `string` | Backend container image | `'ghcr.io/alfredojspera/kon-cloud/backend:latest'` |
| `frontendImage` | `string` | Frontend container image | `'ghcr.io/alfredojspera/kon-cloud/frontend:latest'` |
