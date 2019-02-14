import { scrollToElement, waitForElementToBePresent } from './test-utilities'
import moment from 'moment-timezone'

export function mapAssetRowElementsToProperties (rowElementArray, teVersion) {
  return rowElementArray.map(function (row) {
    if (teVersion >= '8.6.1') {
      return {
        assetId: row.getAttribute('data-hook-object-id'),
        consoleId: row.getAttribute('data-hook-console-id'),
        assetName: row.element(by.css(`[data-hook="name"]`)).getText(),
        assetStatus: row.element(by.css(`[data-hook="status"]`)).getText(),
        duration: row.element(by.css(`[data-hook="current-duration"]`)).getText(),
        averageDuration: row.element(by.css(`[data-hook="average-duration"]`)).getText(),
        osType: row.element(by.css(`[data-hook="type"]`)).getText(),
        agentType: row.element(by.css(`[data-hook="agent"]`)).getText()
      }
    } else {
      return {
        assetId: row.getAttribute('data-hook-object-id'),
        consoleId: row.getAttribute('data-hook-console-id'),
        assetName: row.element(by.css(`[data-hook="name"]`)).getText(),
        osType: row.element(by.css(`[data-hook="type"]`)).getText(),
        agentType: row.element(by.css(`[data-hook="agent"]`)).getText()
      }
    }
  })
}

export function goToTaskAssetDrillDownPage (operationsPage, assetDrillDownPage, targetTaskId) {
  scrollToElement(operationsPage.getTargetTask(targetTaskId))

  // launch the operations asset page
  operationsPage.getTargetTask(targetTaskId).click()
  waitForElementToBePresent(assetDrillDownPage.getDrillDownOperationName())
}

export function getOperationAssetDrilldownUrl (operationsPage, assetDrillDownPage, targetTaskId) {
  goToTaskAssetDrillDownPage(operationsPage, assetDrillDownPage, targetTaskId)
  return browser.driver.getCurrentUrl()
}

export function capitalizeEachWord (str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}

export function getOperationAssetBreadcrumbsTaskList (operationsPage, assetDrillDownPage, targetTaskId) {
  goToTaskAssetDrillDownPage(operationsPage, assetDrillDownPage, targetTaskId)
  assetDrillDownPage.getTaskSelectDropdown().click()
}

export function getTaskNameAndDescription (task, consoleDefaultTaskList) {
  let taskName = task['name']
  let taskNameAndDescription = taskName
  if (consoleDefaultTaskList.includes(task['name']) && !task['name'].includes('VMware')) {
    taskName = capitalizeEachWord(task['name'])
  }
  if (task['description']) {
    taskNameAndDescription = taskName + '\n' + task['description']
  }
  return taskNameAndDescription
}

export function findTEAssetInTOCAssetList (teAssetList, assetName) {
  let filteredList = teAssetList.filter(teAsset => teAsset['asset_name'] == assetName)
  return filteredList.length == 1 ? filteredList[0] : undefined
}

export const shortMonthNameDate = (date, tz) => {
  // Note: tz is the timezone name that test browsers start on - by default, moment will convert the
  // formatted date to the system's local time
  if (!date) {
    return 'Not Present'
  }
  const formatString = 'MMM D, YYYY - h:mm a'
  return tz
    ? moment(date)
      .tz(tz)
      .format(formatString)
    : moment(date).format(formatString)
}

export const convertTimeFromTe = teTime => {
  if (!teTime) {
    return 'Not Present'
  }
  return moment(teTime, 'HH:mm A').format('h:mm a')
}

const daysOfWeekToString = daysOfWeek => {
  const numberOfDays = daysOfWeek.length
  if (numberOfDays === 1) {
    return daysOfWeek[0]
  } else if (numberOfDays === 2) {
    return daysOfWeek.join(' and ')
  } else {
    const begin = daysOfWeek.slice(0, daysOfWeek.length - 1)
    const end = daysOfWeek.slice(-1)
    return `${begin.join(', ')} and ${end}`
  }
}

// The function is based on https://github.scm.tripwire.com/tw-mp/console/blob/master/ui/src/operations/ScheduleFormatter.js
export function getScheduleInfo (schedule, tz) {
  switch (schedule['type']) {
    case 'Manually':
      return 'Manual'
    case 'Hourly': {
      const minutes = parseInt(schedule['minutes'], 10)
      if (minutes === 0) {
        return 'Every hour on the hour'
      } else if (minutes === 1) {
        return 'Every hour at 1 minute past the hour'
      } else {
        return `Every hour at ${minutes} minutes past the hour`
      }
    }
    case 'Daily': {
      return `Every day at ${convertTimeFromTe(schedule['time'])}`
    }
    case 'Weekly': {
      const daysOfWeekAsString = daysOfWeekToString(schedule['daysOfWeek'])
      return `Every week at ${convertTimeFromTe(schedule['time'])} on ${daysOfWeekAsString}`
    }
    case 'Monthly': {
      return `Every month on day ${schedule['day']} at ${convertTimeFromTe(schedule['time'])}`
    }
    case 'Monthly by day': {
      const daysOfWeekAsString = daysOfWeekToString(schedule['daysOfWeek'])
      // FYI there was a spelling error in a supported older version of the TE rest api
      const dayOccurrence = schedule['daysOcurrence'] || schedule['daysOccurrence']
      return `Every month on the ${dayOccurrence} ${daysOfWeekAsString} at ${convertTimeFromTe(schedule['time'])}`
    }
    case 'Periodic': {
      const minutes = parseInt(schedule['minutes'], 10)
      const daysOfWeekAsString = daysOfWeekToString(schedule['daysOfWeek'])
      const timeRange = schedule['periodicTimeRange']
        .split(',')
        .map(teTime => convertTimeFromTe(teTime))
        .join(' and ')
      if (minutes === 1) {
        return `Every ${minutes} minute between ${timeRange} on every ${daysOfWeekAsString}`
      } else {
        return `Every ${minutes} minutes between ${timeRange} on every ${daysOfWeekAsString}`
      }
    }
    case 'Interval': {
      const minutes = parseInt(schedule['minutes'], 10)
      if (minutes === 1) {
        return `Every ${minutes} minute`
      } else {
        return `Every ${minutes} minutes`
      }
    }
    case 'Once':
      const formattedDate = tz ? shortMonthNameDate(schedule['date'], tz) : shortMonthNameDate(schedule['date'])
      return `One time at ${formattedDate}`
    default:
      return 'not implemented'
  }
}

// Convert time with format (For example, 1d 1h 20m 10s) to seconds
const convertDhmToSeconds = dhms => {
  if (!dhms) {
    return 'Empty String'
  }
  let day = 0
  let hour = 0
  let minute = 0
  let second = 0
  let dhmsList = dhms.split(' ')

  dhmsList.forEach(function (item) {
    if (item.indexOf('d') > 0) {
      day = item.split('d')[0]
    } else if (item.indexOf('h') > 0) {
      hour = item.split('h')[0]
    } else if (item.indexOf('m') > 0) {
      minute = item.split('m')[0]
    } else if (item.indexOf('s') > 0) {
      second = item.split('s')[0]
    }
  })
  return parseInt(day) * 24 * 3600 + parseInt(hour) * 3600 + parseInt(minute) * 60 + parseInt(second)
}

export const convertTocUiTimeToSeconds = tocTime => {
  if (!tocTime || tocTime === '-') {
    return '-'
  } else if (tocTime === '< 1s') {
    return tocTime
  }
  return convertDhmToSeconds(tocTime)
}

// To compare asset duration/average duration from TE REST API and TOC UI, it is hard to have exactly the same value.
// We need to get a range of TE asset duation/average duration, then verify TOC UI asset duation/average duration is in the range.
// TOC UI doesn't round anything and shows complete hours, minutes, seconds, etc.
// Get the range high end of TE duration/average duration
export const highEndTeTimeInSeconds = teTime => {
  let highEndTeTime = 0
  if (teTime <= 5) {
    highEndTeTime = teTime + 1.5
  } else if (teTime <= 20) {
    highEndTeTime = teTime * (1 + 20 / 100)
  } else if (teTime <= 100) {
    highEndTeTime = teTime * (1 + 10 / 100)
  } else {
    highEndTeTime = teTime * (1 + 5 / 100)
  }
  return highEndTeTime
}

// Get the range low end of TE duration/average duration
export const lowEndTeTimeInSeconds = teTime => {
  let lowEndTeTime = 0
  if (teTime <= 5) {
    lowEndTeTime = teTime - 1.5
  } else if (teTime <= 20) {
    lowEndTeTime = teTime * (1 - 20 / 100)
  } else if (teTime <= 100) {
    lowEndTeTime = teTime * (1 - 10 / 100)
  } else {
    lowEndTeTime = teTime * (1 - 5 / 100)
  }
  return lowEndTeTime
}

// Check asset running state
// if a task is still running on the asset and the asset status is ERROR/TIMEOUT/RUNNING, it returns true
// else it returns false
export const checkAssetRunningStatus = teAsset => {
  return teAsset['rule_complete_count'] < teAsset['rule_total_count']
}

// Update asset status
// If task asset status is RUNNING (or RUNNING with ERROR/TIMEOUT), update the asset status with completed percentage
// If task asset status is OVERTIME, update the asset status with OVERTIME
//      For a completed task run and for any targetable node (asset),
//      if (Current duration - Average duration) > (2 * Standard deviation), the asset status is OVERTIME
export const updateAssetStatus = teAsset => {
  if (teAsset['rule_total_count'] !== 0 && teAsset['rule_complete_count'] < teAsset['rule_total_count']) {
    teAsset['status'] = Math.round(teAsset['rule_complete_count'] * 100 / teAsset['rule_total_count']) + '%'
  } else if (
    teAsset['std_deviation'] !== '-' &&
    teAsset['rule_complete_count'] !== '-' &&
    teAsset['rule_total_count'] !== '-' &&
    teAsset['rule_complete_count'] === teAsset['rule_total_count']
  ) {
    if (teAsset['duration'] - teAsset['avg_duration'] > 2 * teAsset['std_deviation']) {
      teAsset['status'] = 'OVERTIME'
    }
  }
  return teAsset['status']
}

export const getAssetRowElementsToProperties = row => {
  waitForElementToBePresent(row.getAttribute('data-hook-object-id'))
  return {
    assetName: row.element(by.css(`[data-hook="name"]`)).getText(),
    assetStatus: row.element(by.css(`[data-hook="status"]`)).getText(),
    elementToHover: row.element(by.css(`[data-hook="status"]`))
  }
}

export const getPopupTooltipsText = (tocAssetStatus, teAsset) => {
  const newLine = '\n'
  let status
  let msgDetails
  if (tocAssetStatus.indexOf('%') > 0) {
    tocAssetStatus = teAsset['status']
  }
  switch (tocAssetStatus) {
    case 'ERROR': {
      status = 'ERROR'
      msgDetails = 'No details available. Please view logs in console to check for additional information.'
      return `${status}${newLine}${msgDetails}`
    }
    case 'OPERATION STOPPED': {
      status = 'OPERATION STOPPED'
      msgDetails = 'The operation was manually stopped before this asset was fully scanned.'
      return `${status}${newLine}${teAsset['end_time_compact']}${newLine}${msgDetails}`
    }
    case 'TIMEOUT': {
      status = 'OPERATION TIMEOUT'
      msgDetails = 'The opeation timed-out before this asset was fully scanned.'
      return `${status}${newLine}${teAsset['end_time_compact']}${newLine}${msgDetails}`
    }
    case 'COMPLETED':
      return 'OPERATION COMPLETED'
    case 'RUNNING': {
      const completedRule = teAsset['rule_complete_count'] + '/' + teAsset['rule_total_count']
      status = 'OPERATION RUNNING'
      msgDetails = 'completed rules'
      return `${status}${newLine}${completedRule}${newLine}${msgDetails}`
    }
    case 'SKIPPED': {
      status = 'OPERATION SKIPPED'
      msgDetails = "The rules in this operation are incompatible with this asset's platform."
      return `${status}${newLine}${msgDetails}`
    }
    case 'OVERTIME': {
      status = 'OPERATION COMPLETED OVERTIME'
      msgDetails = 'Scanning this asset took '
      return `${status}${newLine}${teAsset['end_time_compact']}${newLine}${msgDetails}`
    }
    case 'UNKNOWN': {
      status = 'UNKNOWN STATE'
      msgDetails = 'Asset status will be available upon next operation run.'
      return `${status}${newLine}${msgDetails}`
    }
    default:
      return 'not implemented'
  }
}

export const mapAssetStatus = (assetStatus, teAsset) => {
  if (assetStatus.indexOf('%') > 0) {
    return teAsset['status']
  } else if (assetStatus === 'OPERATION STOPPED') {
    return 'STOPPED'
  } else {
    return assetStatus
  }
}

export const getScanningProgressTitle = task => {
  let scanningProgressTitle
  if (task['teVersion'] < '8.6.1') {
    scanningProgressTitle = 'ASSET SCANNING'
  } else {
    scanningProgressTitle = 'ASSET SCANNING PROGRESS'
  }
  return scanningProgressTitle
}

const assetScanningPercentage = task => {
  let assetDoneCount
  let assetDonePercentage
  const assetTotalCount = task['scoped']
  const assetStatusCountList = getAssetStatusCount(task)

  if (task['status'] === 'Running' || task['status'] === 'Idle' || task['scoped'] === 0) {
    assetDoneCount = assetStatusCountList['completed'] + assetStatusCountList['failed']
  } else {
    assetDoneCount =
      assetStatusCountList['completed'] + assetStatusCountList['failed'] + assetStatusCountList['skipped']
  }

  assetDonePercentage = Math.round(assetDoneCount * 100 / assetTotalCount) + '%'
  if (assetDonePercentage === '100%') {
    assetDonePercentage = ''
  }
  return assetDonePercentage
}

export const getScanningProgressLabels = task => {
  let scanningProgressLabelList
  if (task['status'] === 'Running' || task['status'] === 'Idle' || task['teVersion'] < '8.6.1') { scanningProgressLabelList = ['Completed', 'In-Progress', 'Remaining', 'Failed'] } else {
    scanningProgressLabelList = ['Completed', 'In-Progress', 'Skipped', 'Failed']
  }
  return scanningProgressLabelList
}

export const getScanningProgressBarText = task => {
  if (task['teVersion'] >= '8.6.1') {
    switch (task['status']) {
      case 'Complete':
        return 'COMPLETED'
      case 'Complete with errors':
        return 'COMPLETED with ERRORS'
      case 'Running':
        return assetScanningPercentage(task)
      case 'Stopped': {
        if (assetScanningPercentage(task)) {
          return 'STOPPED ' + assetScanningPercentage(task)
        }
        return 'STOPPED'
      }
      case 'Timed Out': {
        if (assetScanningPercentage(task)) {
          return 'TIMEOUT ' + assetScanningPercentage(task)
        }
        return 'TIMEOUT'
      }
      default:
        return ''
    }
  } else {
    switch (task['status']) {
      case 'Complete':
        return 'COMPLETED'
      case 'Complete with errors':
        return 'COMPLETED with ERRORS'
      case 'Running':
        return 'In progress…'
      case 'Stopped':
        return 'STOPPED'
      case 'Timed Out':
        return 'TIMEOUT'
      case 'Idle':
        return 'IDLE'
      default:
        return ''
    }
  }
}

export const getScanningProgressBarStatus = taskStatus => {
  switch (taskStatus) {
    case 'Complete with errors':
      return 'status_error'
    case 'Stopped':
      return 'status_warning'
    default:
      return 'status_running'
  }
}

export const getAssetStatusCount = task => {
  let assetStatusCountList = {}
  assetStatusCountList['completed'] = '-'
  assetStatusCountList['inProgress'] = '-'
  assetStatusCountList['remaining'] = '-'
  assetStatusCountList['skipped'] = '-'
  assetStatusCountList['failed'] = '-'

  if (task['teVersion'] >= '8.6.1' && task['status'] !== 'Idle' && task['scoped'] !== 0) {
    assetStatusCountList['completed'] = task['targetable_nodes'].filter(
      node => node['status'] === 'COMPLETED' || node['status'] === 'OPERATION STOPPED' || node['status'] === 'OVERTIME'
    ).length
    assetStatusCountList['inProgress'] = task['targetable_nodes'].filter(
      node => node['rule_total_count'] > node['rule_complete_count']
    ).length
    assetStatusCountList['remaining'] = task['targetable_nodes'].filter(node => node['status'] === 'SKIPPED').length
    assetStatusCountList['skipped'] = task['targetable_nodes'].filter(node => node['status'] === 'SKIPPED').length
    assetStatusCountList['failed'] = task['targetable_nodes'].filter(
      node => node['status'] === 'ERROR' && node['rule_total_count'] === node['rule_complete_count']
    ).length
  } else if (task['teVersion'] < '8.6.1' && task['status'] === 'Running') {
    assetStatusCountList = {}
  }
  return assetStatusCountList
}

const getSearchTermList = termString => {
  let searchTermList = []
  termString = termString.replace(/^\s+/, '').replace(/\s+$/, '')
  if (termString !== '') {
    searchTermList = termString.match(/[^\s]+/g)
  }
  return searchTermList
}

export const trimString = term => {
  const maxLength = 200
  return term.length > maxLength ? term.substring(0, maxLength - 1) : term
}

export const searchAssetDrillDownTable = (teConsoleVersion, assetList, searchTerms) => {
  const searchTermList = getSearchTermList(trimString(searchTerms))
  let filteredAssetList = []
  let updatedAssetList = assetList
  searchTermList.forEach(function (searchTerm) {
    const searchTermInLowerCase = searchTerm.toLowerCase()
    if (teConsoleVersion >= '8.6.1') {
      filteredAssetList = updatedAssetList.filter(
        asset =>
          asset['asset_name'].toLowerCase().includes(searchTermInLowerCase) ||
          asset['status'].toLowerCase().includes(searchTermInLowerCase) ||
          asset['type'].toLowerCase().includes(searchTermInLowerCase) ||
          asset['agent'].toLowerCase().includes(searchTermInLowerCase)
      )
    } else {
      filteredAssetList = updatedAssetList.filter(
        asset =>
          asset['asset_name'].toLowerCase().includes(searchTermInLowerCase) ||
          asset['type'].toLowerCase().includes(searchTermInLowerCase) ||
          asset['agent'].toLowerCase().includes(searchTermInLowerCase)
      )
    }
    updatedAssetList = filteredAssetList
  })
  return filteredAssetList
}
