using 'main.bicep'

// Omitting location here allows all resources to automatically inherit 
// the Resource Group's location (resourceGroup().location).
// To override the location, uncomment the line below:
// param location = 'northeurope'

param appName = 'kon-cloud'
param environment = 'prod'
param appServicePlanSku = 'B1'
param sqlDatabaseSku = 'S0'
param sqlAdminUser = 'konadmin'

// NOTE: Replace this with your actual strong admin password during deployment
param sqlAdminPassword = 'ComplexPassword123!'

param backendImage = 'ghcr.io/alfredojspera/kon-cloud/backend:latest'
param frontendImage = 'ghcr.io/alfredojspera/kon-cloud/frontend:latest'
