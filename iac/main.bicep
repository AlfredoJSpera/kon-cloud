@description('Target Azure region for all resources')
param location string = resourceGroup().location

@description('Application name prefix used across resource names')
param appName string = 'kon-cloud'

@description('Environment name (e.g. dev, staging, prod)')
param environment string = 'prod'

@description('App Service Plan SKU size')
param appServicePlanSku string = 'B1'

@description('Azure SQL Server Administrator Username')
param sqlAdminUser string = 'konadmin'

@description('Azure SQL Server Administrator Password')
@secure()
param sqlAdminPassword string

@description('Azure SQL Database SKU')
param sqlDatabaseSku string = 'S0'

@description('Backend container image reference')
param backendImage string = 'ghcr.io/alfredojspera/kon-cloud/backend:latest'

@description('Frontend container image reference')
param frontendImage string = 'ghcr.io/alfredojspera/kon-cloud/frontend:latest'

@description('Secret for signing access tokens')
@secure()
param accessTokenSecret string = ''

@description('Secret for signing refresh tokens')
@secure()
param refreshTokenSecret string = ''

@description('Secret for CSRF cookie validation')
@secure()
param csrfTokenSecret string = ''

var namePrefix = '${appName}-${environment}'
var sqlServerName = 'sqlserver-${appName}-${uniqueString(resourceGroup().id)}'
var effectiveAccessTokenSecret = empty(accessTokenSecret) ? uniqueString(resourceGroup().id, 'access-token-secret') : accessTokenSecret
var effectiveRefreshTokenSecret = empty(refreshTokenSecret) ? uniqueString(resourceGroup().id, 'refresh-token-secret') : refreshTokenSecret
var effectiveCsrfTokenSecret = empty(csrfTokenSecret) ? uniqueString(resourceGroup().id, 'csrf-token-secret') : csrfTokenSecret

// 1. Networking (VNet & Public IP)
module vnetModule 'modules/vnet.bicep' = {
  name: 'vnetDeployment'
  params: {
    location: location
    namePrefix: namePrefix
  }
}

// 2. Azure SQL Database
module sqlModule 'modules/sql.bicep' = {
  name: 'sqlDeployment'
  params: {
    location: location
    sqlServerName: sqlServerName
    databaseName: 'kon'
    administratorLogin: sqlAdminUser
    administratorLoginPassword: sqlAdminPassword
    sqlSkuName: sqlDatabaseSku
  }
}

// 3. App Service Plan & App Services (Backend and Frontend Web Apps)
module appServiceModule 'modules/appservice.bicep' = {
  name: 'appServiceDeployment'
  params: {
    location: location
    namePrefix: namePrefix
    skuName: appServicePlanSku
    backendImage: backendImage
    frontendImage: frontendImage
    sqlServerFqdn: sqlModule.outputs.sqlServerFqdn
    sqlDatabaseName: sqlModule.outputs.databaseName
    sqlAdminUser: sqlAdminUser
    sqlAdminPassword: sqlAdminPassword
    appGatewayPublicIp: vnetModule.outputs.publicIpAddress
    accessTokenSecret: effectiveAccessTokenSecret
    refreshTokenSecret: effectiveRefreshTokenSecret
    csrfTokenSecret: effectiveCsrfTokenSecret
  }
}

// 4. Azure Application Gateway (Path-based routing)
module appGatewayModule 'modules/appgateway.bicep' = {
  name: 'appGatewayDeployment'
  params: {
    location: location
    namePrefix: namePrefix
    appGatewaySubnetId: vnetModule.outputs.appGatewaySubnetId
    publicIpId: vnetModule.outputs.publicIpId
    backendAppServiceFqdn: appServiceModule.outputs.backendAppServiceFqdn
    frontendAppServiceFqdn: appServiceModule.outputs.frontendAppServiceFqdn
  }
}

output applicationGatewayPublicIp string = vnetModule.outputs.publicIpAddress
output applicationGatewayFqdn string = vnetModule.outputs.publicIpFqdn
output applicationGatewayUrl string = 'http://${vnetModule.outputs.publicIpAddress}'
output backendAppServiceFqdn string = appServiceModule.outputs.backendAppServiceFqdn
output frontendAppServiceFqdn string = appServiceModule.outputs.frontendAppServiceFqdn
output sqlServerFqdn string = sqlModule.outputs.sqlServerFqdn
