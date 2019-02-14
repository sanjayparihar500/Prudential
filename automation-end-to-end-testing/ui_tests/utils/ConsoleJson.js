import fs from 'fs'

export default class ConsoleJson {
  constructor () {
    this.sourceFile = fs.readFileSync('./console_info.json')
    this.jsonContents = JSON.parse(this.sourceFile)
  }

  getAllContents () {
    return this.jsonContents
  }

  getListOfValuesByKey (keyName) {
    return this.jsonContents.map(function (element) {
      return element[keyName]
    })
  }

  getListOfAllOperationGroupNames () {
    let opsGroupNames = []
    this.jsonContents.forEach(function (console) {
      console['tasks'].forEach(function (task) {
        task['group_info'].forEach(function (group) {
          opsGroupNames.push(group['group_name'])
        })
      })
    })
    return opsGroupNames.filter(function (groupName, position, self) {
      return self.indexOf(groupName) == position
    })
  }

  getListOfOperationGroupNamesByConsole (consoleName) {
    let opsByConsole
    this.jsonContents.forEach(function (console) {
      if (console['hostname'] === consoleName) {
        opsByConsole = console['tasks']
          .map(function (task) {
            return task['group_info'][0]['group_name']
          })
          .filter(function (groupName, position, self) {
            return self.indexOf(groupName) == position
          })
      }
    })
    return opsByConsole
  }

  getListOfUniqueAssetNamesUnderGroup (groupName) {
    let assetsUnderGroup = []
    this.jsonContents.forEach(function (console) {
      console['tasks'].forEach(function (task) {
        if (task['group_info'][0]['group_name'] === groupName) {
          task['targetable_nodes'].forEach(function (targetableNode) {
            if (!assetsUnderGroup.includes(targetableNode['asset_name'])) {
              assetsUnderGroup.push(targetableNode['asset_name'])
            }
          })
        }
      })
    })
    return assetsUnderGroup
  }

  getListOfUniqueAssetNamesUnderGroupOneConsole (consoleName, groupName) {
    let assetsUnderGroup = []
    this.jsonContents.forEach(function (console) {
      if (console['hostname'] === consoleName) {
        console['tasks'].forEach(function (task) {
          if (task['group_info'].find(group => group['group_name'] === groupName)) {
            task['targetable_nodes'].forEach(function (targetableNode) {
              if (!assetsUnderGroup.includes(targetableNode['asset_name'])) {
                assetsUnderGroup.push(targetableNode['asset_name'])
              }
            })
          }
        })
      }
    })
    return assetsUnderGroup
  }

  getListOfAllOperationNamesUnderGroup (groupName) {
    let opsUnderGroup = []
    this.jsonContents.forEach(function (console) {
      console['tasks'].forEach(function (task) {
        if (task['group_info'].find(group => group['group_name'] === groupName)) {
          opsUnderGroup.push(task['name'])
        }
      })
    })
    return opsUnderGroup
  }

  getListOfOperationNamesByGroupAndConsoleHostname (consoleName, groupName) {
    let filteredOpList = []
    const allOpsUnderGroup = this.getListOfAllOperationNamesUnderGroup(groupName)
    this.jsonContents.forEach(function (console) {
      if (console['hostname'] === consoleName) {
        console['tasks'].forEach(function (task) {
          if (task['group_info'].find(group => group['group_name'] === groupName)) {
            filteredOpList.push(task['name'])
          }
        })
      }
    })
    return filteredOpList
  }

  getListOfAllTaskObjects () {
    let allOps = []
    this.jsonContents.forEach(function (console) {
      console['tasks'].forEach(function (task) {
        // merge console info and boolean indicating whether the task is grouped into the object
        task['hostname'] = console['hostname']
        task['friendlyName'] = console['friendlyName']
        task['teVersion'] = console['teVersion']
        task['isGrouped'] = task['group_info'][0]['group_name'] !== 'ungrouped'
        allOps.push(task)
      })
    })
    return allOps
  }

  getListOfTaskObjectsByGroupAndConsoleHostname (consoleName, groupName) {
    let opsByConsole = []
    this.jsonContents.forEach(function (console) {
      if (console['hostname'] === consoleName) {
        console['tasks'].forEach(function (task) {
          if (task['group_info'][0]['group_name'] === groupName) {
            task['hostname'] = console['hostname']
            task['friendlyName'] = console['friendlyName']
            task['isGrouped'] = task['group_info'][0]['group_name'] !== 'ungrouped'
            opsByConsole.push(task)
          }
        })
      }
    })
    return opsByConsole
  }

  getListOfAllUniqueAssetNamesScopedToGroups () {
    let uniqueGroupedScopedAssets = []
    const groupNames = this.getListOfAllGroupedOperationGroupNames()
    for (let i = 0; i < groupNames.length; i++) {
      const assets = this.getListOfUniqueAssetNamesUnderGroup(groupNames[i])
      assets.forEach(function (asset) {
        if (!uniqueGroupedScopedAssets.includes(asset)) {
          uniqueGroupedScopedAssets.push(asset)
        }
      })
    }
    return uniqueGroupedScopedAssets
  }

  getListOfAllUngroupedOperationGroupNames () {
    return this.getListOfAllOperationGroupNames().filter(function (name) {
      return name === 'ungrouped'
    })
  }

  getListOfAllGroupedOperationGroupNames () {
    return this.getListOfAllOperationGroupNames().filter(function (name) {
      return name !== 'ungrouped'
    })
  }

  getListOfAllUngroupedOperationNames () {
    return this.getListOfAllOperationNamesUnderGroup('ungrouped')
  }

  getListOfAllGroupedOperationNames () {
    let allOpsNames = []
    this.getAllContents().forEach(function (console) {
      console['tasks'].forEach(function (task) {
        if (task['group_info'].find(group => group['group_name'] !== 'ungrouped')) {
          allOpsNames.push(task['name'])
        }
      })
    })
    return allOpsNames
  }

  findConsoleSectionByKeyValuePair (consoleJsonKeyName, consoleJsonKeyValue) {
    for (let i = 0; i < this.jsonContents.length; i++) {
      if (this.jsonContents[i][consoleJsonKeyName] === consoleJsonKeyValue) {
        return this.jsonContents[i]
      }
    }
    return undefined
  }

  getListOfAllGroupedUniqueAssetNamesOneConsole (consoleHostName) {
    let allGroupedAssetsList = []
    this.getAllContents().forEach(function (console) {
      if (console['hostname'] === consoleHostName) {
        console['tasks'].forEach(function (task) {
          if (task['group_info'].find(group => group['group_name'] !== 'ungrouped')) {
            task['targetable_nodes'].forEach(function (asset) {
              if (allGroupedAssetsList.indexOf(asset['asset_name']) < 0) {
                allGroupedAssetsList.push(asset['asset_name'])
              }
            })
          }
        })
      }
    })
    return allGroupedAssetsList
  }

  getListOfAllUngroupedUniqueAssetNamesOneConsole (consoleHostName) {
    let allUngroupedAssetsList = []
    this.getAllContents().forEach(function (console) {
      if (console['hostname'] === consoleHostName) {
        console['tasks'].forEach(function (task) {
          if (task['group_info'].find(group => group['group_name'] === 'ungrouped')) {
            task['targetable_nodes'].forEach(function (asset) {
              if (allUngroupedAssetsList.indexOf(asset['asset_name']) < 0) {
                allUngroupedAssetsList.push(asset['asset_name'])
              }
            })
          }
        })
      }
    })
    return allUngroupedAssetsList
  }
}
