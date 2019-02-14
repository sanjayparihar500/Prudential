import moment from 'moment'
import 'moment-duration-format'
import { compareMultipleObjects } from './test-utilities'
import OperationsPage from '../page/OperationsPage'
import ConsoleJson from './ConsoleJson'

const operationsPage = new OperationsPage()
const consoleJson = new ConsoleJson()

const getEndTime = (startTime, duration) => {
  // TODO: moment().add() throws a deprecation warning, need to resolve this before it's removed
  return moment(startTime)
    .add(duration, 'seconds')
    .format('MM/DD/YY HH:mm:ss')
}

export function getAlertTaskEndTime (consoleUuid) {
  let teAlertTaskList = consoleJson
    .getListOfAllTaskObjects()
    .filter(
      task =>
        task['consoleuuid'] === consoleUuid &&
        (task['status'] === 'Complete with errors' || task['status'] === 'Timed Out')
    )
  let teAlertTaskWithEndTimeList = []
  teAlertTaskList.forEach(function (teAlertTask) {
    teAlertTask['taskEndTime'] = getEndTime(teAlertTask['last_start_24_hour'], teAlertTask['last_duration'])
    teAlertTaskWithEndTimeList.push(teAlertTask)
  })
  return teAlertTaskWithEndTimeList.sort(compareMultipleObjects('taskEndTime', 'oid')).reverse()
}

export function mapAlertStatus (teStatus) {
  const mappedTocStatus = {
    'Timed Out': 'TIME OUT',
    'Complete with errors': 'ERROR'
  }
  return mappedTocStatus[teStatus]
}
