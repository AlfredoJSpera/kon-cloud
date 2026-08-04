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

@description('Base64-encoded PFX SSL Certificate Data for HTTPS. Defaults to a self-signed certificate if not provided.')
@secure()
param sslCertificateData string = ''

@description('Password for the PFX SSL Certificate')
@secure()
param sslCertificatePassword string = ''

var defaultSslCertData = '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'

var namePrefix = '${appName}-${environment}'
var sqlServerName = 'sqlserver-${appName}-${uniqueString(resourceGroup().id)}'
var effectiveAccessTokenSecret = empty(accessTokenSecret) ? uniqueString(resourceGroup().id, 'access-token-secret') : accessTokenSecret
var effectiveRefreshTokenSecret = empty(refreshTokenSecret) ? uniqueString(resourceGroup().id, 'refresh-token-secret') : refreshTokenSecret
var effectiveCsrfTokenSecret = empty(csrfTokenSecret) ? uniqueString(resourceGroup().id, 'csrf-token-secret') : csrfTokenSecret
var effectiveSslCertData = empty(sslCertificateData) ? defaultSslCertData : sslCertificateData
var effectiveSslCertPassword = empty(sslCertificatePassword) ? 'Password123!' : sslCertificatePassword

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

// 4. Azure Application Gateway (HTTPS port 443 with HTTP->HTTPS redirect & Path-based routing)
module appGatewayModule 'modules/appgateway.bicep' = {
  name: 'appGatewayDeployment'
  params: {
    location: location
    namePrefix: namePrefix
    appGatewaySubnetId: vnetModule.outputs.appGatewaySubnetId
    publicIpId: vnetModule.outputs.publicIpId
    backendAppServiceFqdn: appServiceModule.outputs.backendAppServiceFqdn
    frontendAppServiceFqdn: appServiceModule.outputs.frontendAppServiceFqdn
    sslCertificateData: effectiveSslCertData
    sslCertificatePassword: effectiveSslCertPassword
  }
}

output applicationGatewayPublicIp string = vnetModule.outputs.publicIpAddress
output applicationGatewayFqdn string = vnetModule.outputs.publicIpFqdn
output applicationGatewayUrl string = 'https://${vnetModule.outputs.publicIpAddress}'
output backendAppServiceFqdn string = appServiceModule.outputs.backendAppServiceFqdn
output frontendAppServiceFqdn string = appServiceModule.outputs.frontendAppServiceFqdn
output sqlServerFqdn string = sqlModule.outputs.sqlServerFqdn
