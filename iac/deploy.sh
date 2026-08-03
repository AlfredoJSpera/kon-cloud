#!/usr/bin/env bash
set -euo pipefail

# Usage helper
usage() {
    echo "Usage: $0 [-g RESOURCE_GROUP] [-l LOCATION] [-p PARAMETERS_FILE]"
    echo ""
    echo "Options:"
    echo "  -g, --resource-group  Name of Azure Resource Group (default: rg-kon-cloud-prod)"
    echo "  -l, --location        Azure region location (default: westeurope or existing RG location)"
    echo "  -p, --parameters      Path to parameters file (default: main.bicepparam)"
    echo "  -h, --help            Show this help message"
    exit 1
}

RESOURCE_GROUP="${RESOURCE_GROUP:-rg-kon-cloud-prod}"
LOCATION="${LOCATION:-}"
PARAMETERS_FILE="${PARAMETERS_FILE:-main.bicepparam}"

# Parse flags
while [[ $# -gt 0 ]]; do
    case $1 in
        -g|--resource-group)
            RESOURCE_GROUP="$2"
            shift 2
            ;;
        -l|--location)
            LOCATION="$2"
            shift 2
            ;;
        -p|--parameters)
            PARAMETERS_FILE="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unknown argument: $1"
            usage
            ;;
    esac
done

cd "$(dirname "$0")"

# 1. Verify Azure CLI login
if ! az account show > /dev/null 2>&1; then
    echo "🔐 Not logged into Azure CLI. Launching login..."
    az login
fi

# 2. Determine location if not provided
if az group show --name "$RESOURCE_GROUP" > /dev/null 2>&1; then
    RG_LOCATION=$(az group show --name "$RESOURCE_GROUP" --query location -o tsv)
    echo "ℹ️ Existing resource group '$RESOURCE_GROUP' found in region '$RG_LOCATION'."
    LOCATION="${LOCATION:-$RG_LOCATION}"
else
    LOCATION="${LOCATION:-westeurope}"
    echo "📦 Creating resource group '$RESOURCE_GROUP' in region '$LOCATION'..."
    az group create \
        --name "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --output table
fi

echo "========================================================="
echo "   Azure Infrastructure Deployment using Bicep"
echo "========================================================="
echo "Resource Group : $RESOURCE_GROUP"
echo "Location       : $LOCATION"
echo "Parameters File: $PARAMETERS_FILE"
echo "========================================================="

# 3. Validate Bicep template
echo "🔍 Validating Bicep deployment..."
az deployment group validate \
    --resource-group "$RESOURCE_GROUP" \
    --template-file main.bicep \
    --parameters "$PARAMETERS_FILE" \
    --parameters location="$LOCATION" \
    --output table

# 4. Deploy resources
echo "🚀 Starting Azure deployment..."
az deployment group create \
    --name "kon-cloud-deployment-$(date +%Y%m%d%H%M%S)" \
    --resource-group "$RESOURCE_GROUP" \
    --template-file main.bicep \
    --parameters "$PARAMETERS_FILE" \
    --parameters location="$LOCATION" \
    --output table

echo "========================================================="
echo "✅ Deployment completed successfully!"
echo "========================================================="
