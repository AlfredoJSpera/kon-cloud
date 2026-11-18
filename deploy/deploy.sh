#!/usr/bin/env bash

# ==============================================================================
# Azure Deployment Script for kon-cloud
# Deploy App Service (Multi-container), Azure SQL Database, and Azure Blob Storage
# ==============================================================================

set -euo pipefail

# Configurations
RESOURCE_GROUP="${RESOURCE_GROUP:-rg-kon-cloud}"
LOCATION="${LOCATION:-italynorth}"
APP_NAME_PREFIX="${APP_NAME_PREFIX:-kon-cloud}"
SQL_ADMIN_USER="${SQL_ADMIN_USER:-konadmin}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BICEP_FILE="${SCRIPT_DIR}/main.bicep"

echo "================================================="
echo "   kon-cloud Azure Deployment Script             "
echo "================================================="
echo "Resource Group: ${RESOURCE_GROUP}"
echo "Location:       ${LOCATION}"
echo "Prefix:         ${APP_NAME_PREFIX}"
echo "SQL User:       ${SQL_ADMIN_USER}"
echo "================================================="

# 1. Check Azure CLI Installation
if ! command -v az &> /dev/null; then
    echo "Error: Azure CLI ('az') is not installed. Please install it first: https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
fi

# 2. Check Azure Login
echo "Checking Azure login state..."
if ! az account show &> /dev/null; then
    echo "You are not logged in. Running 'az login'..."
    az login
fi

CURRENT_SUBSCRIPTION=$(az account show --query 'name' -o tsv)
echo "Using Azure Subscription: ${CURRENT_SUBSCRIPTION}"

# 3. Get SQL Admin Password
if [ -z "${SQL_ADMIN_PASSWORD:-}" ]; then
    read -rsp "Enter SQL Admin Password (min 8 characters, numbers, uppercase, special chars): " SQL_ADMIN_PASSWORD
    echo ""
    if [ -z "${SQL_ADMIN_PASSWORD}" ]; then
        echo "Error: SQL Admin Password cannot be empty."
        exit 1
    fi
fi

# 4. Create Resource Group if not existing
echo "Ensuring Resource Group '${RESOURCE_GROUP}' exists..."
az group create --name "${RESOURCE_GROUP}" --location "${LOCATION}" --output table

# 5. Execute Bicep Deployment
echo "Starting deployment via Bicep template..."
DEPLOYMENT_NAME="deploy-kon-cloud-$(date +%Y%m%d-%H%M%S)"

DEPLOY_OUTPUT=$(az deployment group create \
    --name "${DEPLOYMENT_NAME}" \
    --resource-group "${RESOURCE_GROUP}" \
    --template-file "${BICEP_FILE}" \
    --parameters \
        appNamePrefix="${APP_NAME_PREFIX}" \
        location="${LOCATION}" \
        sqlAdminLogin="${SQL_ADMIN_USER}" \
        sqlAdminPassword="${SQL_ADMIN_PASSWORD}" \
    --query 'properties.outputs' -o json)

echo "================================================="
echo "   Deployment Complete Successfully!            "
echo "================================================="

WEB_APP_URL=$(echo "${DEPLOY_OUTPUT}" | jq -r '.webAppUrl.value // empty')
SQL_FQDN=$(echo "${DEPLOY_OUTPUT}" | jq -r '.sqlServerFqdn.value // empty')
STORAGE_NAME=$(echo "${DEPLOY_OUTPUT}" | jq -r '.storageAccountName.value // empty')

echo "Application URL:       ${WEB_APP_URL}"
echo "SQL Server Host:       ${SQL_FQDN}"
echo "Blob Storage Account:  ${STORAGE_NAME}"
echo "================================================="
echo "Note: It may take 2-3 minutes for multi-container images to download and initialize on the App Service."
