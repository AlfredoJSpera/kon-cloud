@description('Azure region for App Service resources')
param location string

@description('Prefix for resource names')
param namePrefix string = 'kon-cloud'

@description('App Service Plan SKU (e.g. B1, S1, P1v3)')
param skuName string = 'B1'

@description('App Service Plan capacity/instances')
param skuCapacity int = 1

@description('Backend container image')
param backendImage string = 'ghcr.io/alfredojspera/kon-cloud/backend:latest'

@description('Frontend container image')
param frontendImage string = 'ghcr.io/alfredojspera/kon-cloud/frontend:latest'

@description('Azure SQL Server FQDN')
param sqlServerFqdn string

@description('Azure SQL Database Name')
param sqlDatabaseName string = 'kon'

@description('SQL Administrator Login')
param sqlAdminUser string

@description('SQL Administrator Password')
@secure()
param sqlAdminPassword string

@description('Public IP address or domain of Application Gateway for CORS/API configuration')
param appGatewayPublicIp string

@secure()
param accessTokenSecret string

@secure()
param refreshTokenSecret string

@secure()
param csrfTokenSecret string

var appServicePlanName = 'asp-${namePrefix}'
var backendAppName = 'app-backend-${namePrefix}-${uniqueString(resourceGroup().id)}'
var frontendAppName = 'app-frontend-${namePrefix}-${uniqueString(resourceGroup().id)}'

resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: appServicePlanName
  location: location
  kind: 'linux'
  sku: {
    name: skuName
    capacity: skuCapacity
  }
  properties: {
    reserved: true // Required for Linux container hosting
  }
}

// Backend App Service
resource backendAppService 'Microsoft.Web/sites@2022-09-01' = {
  name: backendAppName
  location: location
  kind: 'app,linux,container'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'DOCKER|${backendImage}'
      appSettings: [
        {
          name: 'WEBSITES_PORT'
          value: '3000'
        }
        {
          name: 'SV_PORT'
          value: '3000'
        }
        {
          name: 'DB_HOST'
          value: sqlServerFqdn
        }
        {
          name: 'DB_PORT'
          value: '1433'
        }
        {
          name: 'DB_NAME'
          value: sqlDatabaseName
        }
        {
          name: 'DB_USER'
          value: sqlAdminUser
        }
        {
          name: 'DB_PASSWORD'
          value: sqlAdminPassword
        }
        {
          name: 'DB_ENCRYPT'
          value: 'true'
        }
        {
          name: 'DB_TRUST_SERVER_CERTIFICATE'
          value: 'false'
        }
        {
          name: 'ACCESS_TOKEN_SECRET'
          value: accessTokenSecret
        }
        {
          name: 'REFRESH_TOKEN_SECRET'
          value: refreshTokenSecret
        }
        {
          name: 'CSRF_TOKEN_SECRET'
          value: csrfTokenSecret
        }
        {
          name: 'FRONTEND_URL'
          value: 'http://${appGatewayPublicIp}'
        }
        {
          name: 'GENERAL_LIMITER_TRUST_PROXY'
          value: 'true'
        }
        {
          name: 'DOCKER_REGISTRY_SERVER_URL'
          value: 'https://ghcr.io'
        }
        {
          name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
          value: 'false'
        }
      ]
      alwaysOn: skuName != 'F1' && skuName != 'D1' && skuName != 'B1'
    }
  }
}

// Frontend App Service
resource frontendAppService 'Microsoft.Web/sites@2022-09-01' = {
  name: frontendAppName
  location: location
  kind: 'app,linux,container'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'DOCKER|${frontendImage}'
      appSettings: [
        {
          name: 'WEBSITES_PORT'
          value: '80'
        }
        {
          name: 'VITE_BACKEND_URL'
          value: 'http://${appGatewayPublicIp}/api'
        }
        {
          name: 'DOCKER_REGISTRY_SERVER_URL'
          value: 'https://ghcr.io'
        }
        {
          name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
          value: 'false'
        }
      ]
      alwaysOn: skuName != 'F1' && skuName != 'D1' && skuName != 'B1'
    }
  }
}

output appServicePlanId string = appServicePlan.id
output backendAppServiceId string = backendAppService.id
output backendAppServiceFqdn string = backendAppService.properties.defaultHostName
output frontendAppServiceId string = frontendAppService.id
output frontendAppServiceFqdn string = frontendAppService.properties.defaultHostName
