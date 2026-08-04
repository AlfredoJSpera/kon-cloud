# Azure Infrastructure as Code (IaC) - Bicep (HTTPS Enabled)

This directory contains the complete **Bicep** Infrastructure as Code (IaC) templates for deploying the **kon-cloud** application to Microsoft Azure with full **HTTPS (SSL/TLS)** support.

---

## 📐 Architecture Overview

```
                          ┌────────────────────────────────────────────────────────┐
                          │ Resource Group                                         │
                          │                                                        │
                          │   ┌────────────────────────────────────────────────┐   │         ┌────────────────────┐
┌──────────┐              │   │ Azure Application Gateway (Standard_v2)        │   │         │                    │
│          │  HTTPS (443) │   │   • SSL Termination (Port 443 HTTPS Listener)   │   │         │  Azure SQL Server  │
│ Internet │──────────────┼──►│   • /api/* ──► Backend Pool (Backend Web App)  ├───┼────────►│  & Database (kon)  │
│          │  HTTP (80)   │   │   • /*     ──► Frontend Pool (Frontend Web App)│   │         │                    │
└──────────┘  (301 Redirect)  │   • HTTP 80 ──► Redirect 301 to HTTPS 443     │   │         └────────────────────┘
                          │   └────────────────────────────────────────────────┘   │
                          │                           ▲                            │
                          │                           │ (API Calls over HTTPS)     │
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

### Key HTTPS Features Implemented:
- **HTTPS Listener (Port 443)**: Encrypted SSL/TLS listener bound to the Application Gateway public IP.
- **Automated HTTP -> HTTPS Redirect (301)**: All HTTP port 80 traffic is automatically redirected to port 443 HTTPS.
- **Out-of-the-Box Self-Signed SSL Certificate**: Deploys with a valid self-signed TLS certificate by default so you can deploy instantly without needing a custom certificate right away.
- **Custom PFX Support**: Easily supply your own production PFX certificate base64 string and password via parameters.

---

## 🔒 Customizing SSL Certificates (`sslCertificateData` & `sslCertificatePassword`)

To pass a custom production SSL certificate (PFX format):

1. Convert your `.pfx` certificate to base64:
   ```bash
   base64 -w 0 your-certificate.pfx > cert.pfx.b64
   ```

2. Pass `sslCertificateData` and `sslCertificatePassword` when deploying:
   ```bash
   az deployment group create \
     --resource-group rg-kon-cloud-prod \
     --template-file iac/main.bicep \
     --parameters iac/main.bicepparam \
     --parameters location=<ALLOWED_REGION> \
                  sslCertificateData="$(cat cert.pfx.b64)" \
                  sslCertificatePassword="YourCertPassword"
   ```

---

## 🚀 Deployment Commands

### Option 1: Automated Script

```bash
cd iac
./deploy.sh -l <ALLOWED_REGION>
```

### Option 2: Azure CLI

```bash
az group create --name rg-kon-cloud-prod --location <ALLOWED_REGION>

az deployment group create \
  --resource-group rg-kon-cloud-prod \
  --template-file iac/main.bicep \
  --parameters iac/main.bicepparam \
  --parameters location=<ALLOWED_REGION>
```
