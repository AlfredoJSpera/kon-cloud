@description('Azure region for SQL Database resources')
param location string

@description('Azure SQL Server name')
param sqlServerName string

@description('Azure SQL Database name')
param databaseName string = 'kon'

@description('Administrator username for SQL Server')
param administratorLogin string

@description('Administrator password for SQL Server')
@secure()
param administratorLoginPassword string

@description('Azure SQL Database SKU')
param sqlSkuName string = 'S0'

resource sqlServer 'Microsoft.Sql/servers@2022-11-01-preview' = {
  name: sqlServerName
  location: location
  properties: {
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorLoginPassword
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }
}

// Firewall rule to allow access from Azure App Services & internal services
resource allowAzureServicesRule 'Microsoft.Sql/servers/firewallRules@2022-11-01-preview' = {
  parent: sqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource sqlDatabase 'Microsoft.Sql/servers/databases@2022-11-01-preview' = {
  parent: sqlServer
  name: databaseName
  location: location
  sku: {
    name: sqlSkuName
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
  }
}

output sqlServerId string = sqlServer.id
output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName
output sqlDatabaseId string = sqlDatabase.id
output databaseName string = sqlDatabase.name
