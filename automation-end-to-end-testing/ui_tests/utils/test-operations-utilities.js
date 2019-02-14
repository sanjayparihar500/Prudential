import moment from 'moment'
import 'moment-duration-format'
import {
  compareMultipleObjects,
  scrollToElement,
  waitForElementToBeClickable,
  waitForElementToBePresent,
  waitForElementToHaveValue,
  waitForElementToIncludesValue
} from './test-utilities'
import OperationsPage from '../page/OperationsPage'
import ConsoleJson from './ConsoleJson'

const operationsPage = new OperationsPage()
const consoleJson = new ConsoleJson()

export const headerArray = [
  'Name',
  'Status',
  'Console',
  'Scoped',
  'Schedule',
  'Last Start',
  'Last Duration',
  'Timeout',
  'Next Start'
]

export function expandIfGrouped (isGrouped, groupName) {
  if (isGrouped) {
    waitForElementToBePresent(operationsPage.getExpandButton(groupName))
    operationsPage.getExpandButton(groupName).click()
  }
}

export function exposeTaskInRow (consoleUuid, consoleHostName, groupName, isGrouped) {
  waitForElementToBeClickable(operationsPage.getConsoleSelectDropdown())
  operationsPage
    .getConsoleSelectDropdown()
    .click()
    .then(function () {
      waitForElementToBePresent(operationsPage.getConsoleSelectList(consoleUuid))
      operationsPage.getConsoleSelectList(consoleUuid).click()
    })
  waitForElementToHaveValue(operationsPage.getConsoleSelectDropdownSelectionText(), consoleHostName)
  expandIfGrouped(isGrouped, groupName)
}

function findTETaskInTOCTaskList (teTaskList, consoleUuid, operationId) {
  const filteredList = teTaskList.filter(
    teTask => teTask['oid'] === operationId && teTask['consoleuuid'] === consoleUuid
  )
  return filteredList.length === 1 ? filteredList[0] : undefined
}

function collectListOfAllTasksBasedOnConsoleSelection (group, allOrOne, consoleHostName) {
  let teTaskList
  if (allOrOne === 'all') {
    teTaskList = consoleJson
      .getListOfAllTaskObjects()
      .filter(task => task['group_info'].find(groupName => groupName['group_name'] === group))
  } else {
    teTaskList = consoleJson
      .getListOfAllTaskObjects()
      .filter(
        task =>
          task['hostname'] === consoleHostName &&
          task['group_info'].find(groupName => groupName['group_name'] === group)
      )
  }
  return teTaskList
}

export function testOperationTableRows (group, operationsPage, allOrOne, consoleHostName) {
  const teTaskList = collectListOfAllTasksBasedOnConsoleSelection(group, allOrOne, consoleHostName)

  operationsPage
    .getTaskTable(group)
    .getRows()
    .map(function (row) {
      scrollToElement(row)
      return {
        taskId: row.getAttribute('data-hook-object-id'),
        consoleId: row.getAttribute('data-hook-console-id'),
        taskName: row.element(by.css(`[data-hook="name"]`)).getText(),
        consoleName: row.element(by.css(`[data-hook="console"]`)).getText(),
        taskScoped: row.element(by.css(`[data-hook="scoped"]`)).getText(),
        taskSchedule: row.element(by.css(`[data-hook="schedule"]`)).getText(),
        taskLastRun: row.element(by.css(`[data-hook="last-run"]`)).getText(),
        taskLastDuration: row.element(by.css(`[data-hook="last-duration"]`)).getText(),
        taskTimeout: row.element(by.css(`[data-hook="timeout"]`)).getText(),
        taskNextRun: row.element(by.css(`[data-hook="next-run"]`)).getText(),
        taskStatus: row
          .element(by.css(`[data-hook="status"]`))
          .$('.operation_status')
          .$('.status_label')
          .getAttribute('title')
      }
    })
    .then(function (tocTaskList) {
      expect(tocTaskList.length).toBe(teTaskList.length)
      for (let taskIndex = 0; taskIndex < tocTaskList.length; ++taskIndex) {
        const tocTask = tocTaskList[taskIndex]
        const teTask = findTETaskInTOCTaskList(teTaskList, tocTask['consoleId'], tocTask['taskId'])
        expect(teTask).not.toBe(undefined)

        if (teTask) {
          expect(tocTask['taskName'].split('\n')[0].toLowerCase()).toBe(teTask['name'].toLowerCase())
          expect(tocTask['consoleName'].toLowerCase()).toBe(teTask['friendlyName'].toLowerCase())
          expect(tocTask['taskScoped']).toBe(String(teTask['targetable_nodes'].length))
          expect(tocTask['taskSchedule'].toLowerCase()).toBe(teTask['schedule']['type'].toLowerCase())
          expect(tocTask['taskLastRun']).toBe(teTask['last_start_compact'])
          expect(tocTask['taskLastDuration']).toBe(convertLastDuration(teTask['last_duration']))
          expect(tocTask['taskTimeout']).toBe(convertTimeout(teTask['timeout_in_use']))
          const nextStart = teTask['next_start_compact'] === '' ? '-' : teTask['next_start_compact']
          expect(tocTask['taskNextRun']).toBe(nextStart)
          const status = tocTask['taskStatus'] === '' ? 'running' : tocTask['taskStatus']
          expect(status.toLowerCase()).toBe(convertTeRunStatusToTocStatus(teTask['status']))
        }
      }
    })
}

export function testOperationLaunchInContext (group, operationsPage, consoleUuidHostnameMap) {
  operationsPage
    .getTaskTable(group)
    .getRows()
    .map(function (row) {
      if (group === 'ungrouped') {
        scrollToElement(row)
      } else {
        scrollToElement(operationsPage.getTaskGroupNameElement(group))
      }
      waitForElementToBePresent(row.getAttribute('data-hook-object-id'))
      const rowData = {
        consoleId: row.getAttribute('data-hook-console-id'),
        taskId: row.getAttribute('data-hook-object-id'),
        elementToClick: row.getWebElement()
      }
      doTestOperationLaunchInContext(consoleUuidHostnameMap, rowData)
    })
}

function doTestOperationLaunchInContext (consoleUuidHostnameMap, rowData) {
  rowData['taskId'].then(function (taskId) {
    rowData['consoleId'].then(function (consoleId) {
      // Open task search in new browser tab, separated by two ActionSequence blocks. Chaining both clicks
      // together into one sequence results in a failure to find the View in console data-hook.
      // TODO: Update selenium docker images once mouseMoveTo event works in geckodriver
      //  https://github.com/angular/protractor/issues/4177
      browser.driver
        .actions()
        .click(rowData['elementToClick'], protractor.Button.RIGHT)
        .perform()
      browser.driver
        .actions()
        .click(element(by.css(`[data-hook="View logs in console"]`)))
        .perform()
      // Give time for the new tab to open
      browser.driver.sleep(2000)

      // Be sure to close the new tab this opens, otherwise subsequent tests will fail, as the new tab gets the focus
      browser.driver.getAllWindowHandles().then(function (handles) {
        browser.driver.switchTo().window(handles[1])

        const currentUrl = browser.driver.getCurrentUrl()
        const searchCriteria = {
          'search.logMessage.taskGroup.selectedObject': taskId,
          'criteria.searchExecuted': true
        }
        const taskSearchUrl = `https://${
          consoleUuidHostnameMap[consoleId]
        }/console/lic.search.cmd?lic=true&managerId=logViewer&pageId=logViewer.logFinderPage&searchCriteria=${encodeURIComponent(
          JSON.stringify(searchCriteria)
        )}`
        expect(currentUrl).toBe(taskSearchUrl)

        browser.driver.close()
        browser.driver.switchTo().window(handles[0])
      })
    })
  })
}

export function consoleSelect (operationsPage, allOrOne, consoleName) {
  let consoleUuid
  let consoleHostName
  let consoleFriendlyName

  if (allOrOne === 'one') {
    const consoleData = consoleJson.findConsoleSectionByKeyValuePair('hostname', consoleName)
    consoleUuid = consoleData['uuid']
    consoleHostName = consoleData['hostname']
    consoleFriendlyName = consoleData['friendlyName']
  } else {
    consoleUuid = 'all'
    consoleHostName = 'ALL'
    consoleFriendlyName = 'All Consoles'
  }

  scrollToElement(operationsPage.getPageTitle())
  waitForElementToBePresent(operationsPage.getConsoleSelectDropdown())
  operationsPage
    .getConsoleSelectDropdown()
    .click()
    .then(function () {
      let hostNameFriendlyName = consoleHostName + '\n' + consoleFriendlyName
      waitForElementToIncludesValue(operationsPage.getConsoleSelectListText(consoleUuid), hostNameFriendlyName)

      operationsPage
        .getConsoleSelectList(consoleUuid)
        .click()
        .then(function () {
          waitForElementToHaveValue(operationsPage.getConsoleSelectDropdownSelectionText(), consoleHostName)
          expect(operationsPage.getConsoleSelectDropdownSelectionText()).toBe(consoleHostName)
        })
    })
}

export function testOperationTableSort (group, sortType, operationsPage, allOrOne, consoleHostName) {
  const sortNameList = [
    'name',
    'status_priority',
    'console',
    'scoped',
    'schedule',
    'last_start_24_hour',
    'last_duration',
    'timeout_in_use',
    'next_start_24_hour'
  ]

  sortNameList.forEach(function (sortName) {
    consoleSelect(operationsPage, allOrOne, consoleHostName)
    doTestOperationTableSort(group, sortType, operationsPage, sortName, allOrOne, consoleHostName)
  })
}

export function setSortingForColumnHeader (sortType, headerElement) {
  waitForElementToBeClickable(headerElement)
  headerElement.getAttribute('aria-sort').then(function (headerSort) {
    if (sortType === 'ascending' && (headerSort === 'descending' || headerSort === null)) {
      headerElement.click()
    } else if (sortType === 'descending' && headerSort === 'ascending') {
      headerElement.click()
    } else if (sortType === 'descending' && headerSort === null) {
      headerElement.click()
      waitForElementToBeClickable(headerElement)
      headerElement.click()
    }
  })
  waitForElementToBeClickable(headerElement)
}

function doTestOperationTableSort (group, sortType, operationsPage, sortName, allOrOne, consoleHostName) {
  const teTaskList = collectListOfAllTasksBasedOnConsoleSelection(group, allOrOne, consoleHostName)
  const sortHeaderMap = {
    name: 'Name',
    status_priority: 'Status',
    console: 'Console',
    scoped: 'Scoped',
    schedule: 'Schedule',
    last_start_24_hour: 'Last Start',
    last_duration: 'Last Duration',
    timeout_in_use: 'Timeout',
    next_start_24_hour: 'Next Start'
  }

  if (group !== 'ungrouped') {
    waitForElementToBeClickable(operationsPage.getExpandButton(group))
    operationsPage.getExpandButton(group).click()
  }

  operationsPage
    .getTaskTable(group)
    .getHeaders()
    .each(function (header) {
      header.getAttribute('aria-label').then(function (headerName) {
        if (sortHeaderMap[sortName] === headerName) {
          header.getAttribute('aria-sort').then(function (headerSort) {
            let sortedTeTaskList = []
            if (sortType === 'ascending') {
              setSortingForColumnHeader(sortType, header)
              sortedTeTaskList = teTaskList.sort(compareMultipleObjects(sortName, 'consoleuuid', 'oid'))
            } else {
              setSortingForColumnHeader(sortType, header)
              sortedTeTaskList = teTaskList.sort(compareMultipleObjects(sortName, 'consoleuuid', 'oid')).reverse()
            }

            operationsPage
              .getTaskTable(group)
              .getRows()
              .map(function (row) {
                scrollToElement(row)

                return {
                  taskId: row.getAttribute('data-hook-object-id'),
                  consoleId: row.getAttribute('data-hook-console-id'),
                  taskName: row.element(by.css(`[data-hook="name"]`)).getText(),
                  consoleName: row.element(by.css(`[data-hook="console"]`)).getText(),
                  taskScoped: row.element(by.css(`[data-hook="scoped"]`)).getText(),
                  taskSchedule: row.element(by.css(`[data-hook="schedule"]`)).getText(),
                  taskLastRun: row.element(by.css(`[data-hook="last-run"]`)).getText(),
                  taskLastDuration: row.element(by.css(`[data-hook="last-duration"]`)).getText(),
                  taskTimeout: row.element(by.css(`[data-hook="timeout"]`)).getText(),
                  taskNextRun: row.element(by.css(`[data-hook="next-run"]`)).getText(),
                  taskStatus: row
                    .element(by.css(`[data-hook="status"]`))
                    .$('.operation_status')
                    .$('.status_label')
                    .getAttribute('title')
                }
              })
              .then(function (tocTaskList) {
                expect(tocTaskList.length).toBe(sortedTeTaskList.length)

                for (let taskIndex = 0; taskIndex < tocTaskList.length; ++taskIndex) {
                  const tocTask = tocTaskList[taskIndex]
                  const teTask = sortedTeTaskList[taskIndex]
                  expect(tocTask['consoleId']).toBe(teTask['consoleuuid'])
                  expect(tocTask['taskId']).toBe(teTask['oid'])
                  expect(tocTask['taskName'].split('\n')[0].toLowerCase()).toBe(teTask['name'].toLowerCase())
                  const descriptionFromUi = tocTask['taskName'].split('\n')[1]
                  if (descriptionFromUi) {
                    expect(descriptionFromUi.toLowerCase()).toBe(teTask['description'].toLowerCase())
                  }
                  expect(tocTask['consoleName'].toLowerCase()).toBe(teTask['friendlyName'].toLowerCase())
                  expect(tocTask['taskScoped']).toBe(String(teTask['targetable_nodes'].length))
                  expect(tocTask['taskSchedule'].toLowerCase()).toBe(teTask['schedule']['type'].toLowerCase())
                  expect(tocTask['taskLastRun']).toBe(teTask['last_start_compact'])
                  expect(tocTask['taskLastDuration']).toBe(convertLastDuration(teTask['last_duration']))
                  expect(tocTask['taskTimeout']).toBe(convertTimeout(teTask['timeout_in_use']))
                  const nextStart = teTask['next_start_compact'] === '' ? '-' : teTask['next_start_compact']
                  expect(tocTask['taskNextRun']).toBe(nextStart)
                  const status = tocTask['taskStatus'] === '' ? 'running' : tocTask['taskStatus']
                  expect(status.toLowerCase()).toBe(convertTeRunStatusToTocStatus(teTask['status']))
                }
              })
          })
        }
      })
    })

  if (group !== 'ungrouped') {
    waitForElementToIncludesValue(operationsPage.getCollapseButton(group), 'COLLAPSE')
    operationsPage.getCollapseButton(group).click()
  }
}

function convertTeRunStatusToTocStatus (teRunStatus) {
  const lowerCaseTeStatus = teRunStatus.toLowerCase()
  if (lowerCaseTeStatus === 'complete with errors') {
    return 'error'
  } else if (lowerCaseTeStatus === 'complete') {
    return 'completed'
  }
  return lowerCaseTeStatus
}

function convertLastDuration (lastDuration) {
  let showLastDuration
  if (lastDuration === -1) {
    showLastDuration = ''
  } else {
    showLastDuration = shortDuration(lastDuration)
  }
  return showLastDuration
}

// Taken from TOC UI directly:
// https://github.scm.tripwire.com/tw-mp/console/blob/3b7ddee7db2a9cf5d7138302fd251dbe4b4594c7/ui/src/util/dateUtils.js#L8
const shortDuration = inputSeconds => {
  const duration = moment.duration(inputSeconds, 'seconds')
  let format = ''

  if (duration.days() > 0) {
    format = 'd[d] H[h] m[m]'
  } else {
    if (duration.hours() > 0) {
      format = 'H[h] m[m]'
    } else {
      if (duration.minutes() > 0) {
        format = 'm[m] s[s]'
      } else {
        if (duration.seconds() > 0) {
          format = 's[s]'
        } else {
          format = '< 1[s]'
        }
      }
    }
  }

  return duration.format(format)
}

function convertTimeout (timeout) {
  let showTimeout
  if (timeout === -1) {
    showTimeout = ''
  } else {
    showTimeout = shortTimeout(timeout)
  }
  return showTimeout
}

const shortTimeout = inputSeconds => {
  const duration = moment.duration(inputSeconds, 'seconds')
  let format = ''

  if (duration.days() > 0) {
    format = 'd[d] H[h] m[m]'
  } else {
    if (duration.hours() > 0) {
      format = 'H[h] m[m]'
    } else {
      if (duration.minutes() > 0) {
        format = 'm[m]'
      }
    }
  }

  return duration.format(format)
}
