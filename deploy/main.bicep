@description('Base prefix for all resource names')
@minLength(3)
@maxLength(15)
param appNamePrefix string = 'kon-cloud'

@description('Azure region for all resources')
param location string = resourceGroup().location

@description('SQL Server Administrator Username')
param sqlAdminLogin string = 'konadmin'

@description('SQL Server Administrator Password')
@secure()
param sqlAdminPassword string

@description('SQL Database Tier SKU')
param sqlDatabaseSku string = 'Standard'

@description('SQL Database SKU Name')
param sqlDatabaseSkuName string = 'S0'

@description('App Service Plan SKU')
param appServicePlanSku string = 'B1'

@description('JWT Access Token Secret')
@secure()
param accessTokenSecret string = base64(newGuid())

@description('JWT Refresh Token Secret')
@secure()
param refreshTokenSecret string = base64(newGuid())

@description('CSRF Token Secret')
@secure()
param csrfTokenSecret string = base64(newGuid())

var uniqueSuffix = uniqueString(resourceGroup().id)
var sanitizedPrefix = toLower(replace(appNamePrefix, '-', ''))
var storageAccountName = '${take(sanitizedPrefix, 11)}st${take(uniqueSuffix, 11)}'
var sqlServerName = '${appNamePrefix}-sql-${uniqueSuffix}'
var databaseName = 'kon'
var appServicePlanName = '${appNamePrefix}-asp-${uniqueSuffix}'
var webAppName = '${appNamePrefix}-app-${uniqueSuffix}'
var storageContainerName = 'expense-attachments'
var webAppUrl = 'https://${webAppName}.azurewebsites.net'
var dockerComposeContent = loadTextContent('./docker-compose.azure.yml')

// ------------------------------------------------------------------
// Azure Storage Account & Blob Container
// ------------------------------------------------------------------
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

resource blobContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: storageContainerName
  properties: {
    publicAccess: 'None'
  }
}

// ------------------------------------------------------------------
// Azure SQL Server & Database
// ------------------------------------------------------------------
resource sqlServer 'Microsoft.Sql/servers@2022-05-01-preview' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: sqlAdminLogin
    administratorLoginPassword: sqlAdminPassword
    version: '12.0'
    minimalTlsVersion: '1.2'
  }
}

resource sqlDatabase 'Microsoft.Sql/servers/databases@2022-05-01-preview' = {
  parent: sqlServer
  name: databaseName
  location: location
  sku: {
    name: sqlDatabaseSkuName
    tier: sqlDatabaseSku
  }
}

// Allow Azure Services (App Service) to access SQL Server
resource sqlFirewallAllowAzure 'Microsoft.Sql/servers/firewallRules@2022-05-01-preview' = {
  parent: sqlServer
  name: 'AllowAllWindowsAzureIps'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// ------------------------------------------------------------------
// Azure App Service Plan & Web App (Multi-container)
// ------------------------------------------------------------------
resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: appServicePlanName
  location: location
  kind: 'linux'
  properties: {
    reserved: true
  }
  sku: {
    name: appServicePlanSku
  }
}

var storageConnectionString = 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'

resource webApp 'Microsoft.Web/sites@2022-09-01' = {
  name: webAppName
  location: location
  kind: 'app,linux,container'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'COMPOSE|${base64(dockerComposeContent)}'
      alwaysOn: true
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      appSettings: [
        {
          name: 'WEBSITES_PORT'
          value: '80'
        }
        {
          name: 'DB_HOST'
          value: sqlServer.properties.fullyQualifiedDomainName
        }
        {
          name: 'DB_PORT'
          value: '1433'
        }
        {
          name: 'DB_NAME'
          value: databaseName
        }
        {
          name: 'DB_USER'
          value: sqlAdminLogin
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
          name: 'AZURE_STORAGE_CONNECTION_STRING'
          value: storageConnectionString
        }
        {
          name: 'AZURE_STORAGE_CONTAINER_NAME'
          value: storageContainerName
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
          value: webAppUrl
        }
        {
          name: 'VITE_BACKEND_URL'
          value: webAppUrl
        }
      ]
    }
  }
}

// ------------------------------------------------------------------
// Outputs
// ------------------------------------------------------------------
output webAppUrl string = webAppUrl
output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName
output storageAccountName string = storageAccount.name
output blobContainerName string = storageContainerName
