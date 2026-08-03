@description('Azure region for network resources')
param location string

@description('Name prefix for network resources')
param namePrefix string = 'kon-cloud'

@description('Virtual Network address space prefix')
param vnetAddressPrefix string = '10.0.0.0/16'

@description('Subnet prefix for Application Gateway')
param appGatewaySubnetPrefix string = '10.0.1.0/24'

@description('Subnet prefix for App Services')
param appServiceSubnetPrefix string = '10.0.2.0/24'

var vnetName = 'vnet-${namePrefix}'
var publicIpName = 'pip-appgw-${namePrefix}'

resource publicIp 'Microsoft.Network/publicIPAddresses@2023-09-01' = {
  name: publicIpName
  location: location
  sku: {
    name: 'Standard'
    tier: 'Regional'
  }
  properties: {
    publicIPAllocationMethod: 'Static'
    publicIPAddressVersion: 'IPv4'
    dnsSettings: {
      domainNameLabel: '${namePrefix}-${uniqueString(resourceGroup().id)}'
    }
  }
}

resource vnet 'Microsoft.Network/virtualNetworks@2023-09-01' = {
  name: vnetName
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [
        vnetAddressPrefix
      ]
    }
    subnets: [
      {
        name: 'AppGatewaySubnet'
        properties: {
          addressPrefix: appGatewaySubnetPrefix
        }
      }
      {
        name: 'AppServiceSubnet'
        properties: {
          addressPrefix: appServiceSubnetPrefix
          delegations: [
            {
              name: 'appServiceDelegation'
              properties: {
                serviceName: 'Microsoft.Web/serverFarms'
              }
            }
          ]
        }
      }
    ]
  }
}

output vnetId string = vnet.id
output appGatewaySubnetId string = vnet.properties.subnets[0].id
output appServiceSubnetId string = vnet.properties.subnets[1].id
output publicIpId string = publicIp.id
output publicIpAddress string = publicIp.properties.ipAddress
output publicIpFqdn string = publicIp.properties.dnsSettings.fqdn
