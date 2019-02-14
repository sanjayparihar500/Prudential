import naturalCompare from 'natural-compare'
import GetElements from '../page/GetElementUtilities'

const MAX_WAIT_INTERVAL = 10000
export const FIVE_MINUTES_IN_MILLIS = 300000
export const SEVEN_MINUTES_IN_MILLIS = 420000
export const NINE_MINUTES_IN_MILLIS = 540000
const getElements = new GetElements()

const customMatchers = {
  toBeAUuid: function () {
    return {
      compare: function (actual) {
        const uuidRegex = new Array(3).fill('[-a-z0-9]+').join(':')
        return actual.match(uuidRegex)
          ? { pass: true }
          : { pass: false, message: `${actual} did not match ${uuidRegex}` }
      }
    }
  }
}

export const uuidMatchers = customMatchers

export function backBrowser () {
  browser.driver.navigate().back()
  browser.driver.sleep(1000)
}

export function scrollToElement (element, alignToTop = true) {
  browser.executeScript(`arguments[0].scrollIntoView(${alignToTop});`, element)
}

export function waitForElementToBePresent (element) {
  const until = protractor.ExpectedConditions
  browser.driver.wait(until.presenceOf(element), MAX_WAIT_INTERVAL)
}

export function waitForElementToBeClickable (element) {
  const until = protractor.ExpectedConditions
  browser.driver.wait(until.elementToBeClickable(element), MAX_WAIT_INTERVAL)
  browser.driver.sleep(1000)
}

export function waitForElementToBeAbsent (element) {
  const until = protractor.ExpectedConditions
  browser.driver.wait(until.stalenessOf(element), MAX_WAIT_INTERVAL)
}

export function waitForElementToHaveClass (element, classValue) {
  browser.driver.wait(function () {
    return element.getAttribute('class').then(function (value) {
      return value.indexOf(classValue) >= 0
    })
  }, MAX_WAIT_INTERVAL)
}

export function waitForElementToHaveValue (element, expectedValue) {
  waitForElementToBePresent(element)
  browser.driver.wait(function () {
    return element.getText().then(function (value) {
      return value === expectedValue
    })
  }, MAX_WAIT_INTERVAL)
}

export function waitForElementToHaveAttributeValue (element, expectedValue) {
  waitForElementToBePresent(element)
  browser.driver.wait(function () {
    return element.getAttribute('value').then(function (value) {
      browser.driver.sleep(4000)
      return value === expectedValue
    })
  }, MAX_WAIT_INTERVAL)
}

export function waitForElementToIncludesValue (element, expectedValue) {
  waitForElementToBePresent(element)
  browser.driver.wait(function () {
    return element.getText().then(function (value) {
      return value.includes(expectedValue)
    })
  }, MAX_WAIT_INTERVAL)
}

export function waitForTitleToBe (expectedTitle) {
  const until = protractor.ExpectedConditions
  browser.driver.wait(
    until.titleIs(expectedTitle),
    MAX_WAIT_INTERVAL,
    `Timed out waiting for title to be:  ${expectedTitle}`
  )
}

export function waitForUrlToLoad (expectedUrl) {
  const until = protractor.ExpectedConditions
  browser.driver.wait(
    until.urlIs(expectedUrl),
    MAX_WAIT_INTERVAL,
    `Timed out waiting for page to change to: ${expectedUrl}`
  )
}

export function mouseOverToElement (element) {
  waitForElementToBePresent(element)
  let loc = element.getLocation()
  browser.driver
    .actions()
    .mouseMove(loc)
    .perform()
  browser.driver.sleep(2000)
}

export function getHeaderTexts (tableHeaders) {
  return tableHeaders
    .map(function (headerText) {
      return headerText.getAttribute('title')
    })
    .then(function (headerList) {
      return headerList.filter(header => header.length > 0)
    })
}

export function convertStringToInteger (value) {
  return parseInt(value.replace(',', ''))
}

export const countToPercentage = (count, total) => {
  if (count === 0) {
    return '0%'
  }
  const percent = count * 100 / total
  if (Math.floor(percent) === 0) {
    return '<1%'
  } else if (Math.floor(percent) === 99) {
    return '99%'
  }
  return `${percent.toFixed()}%`
}

function simpleCompareByKey (key, order) {
  return function (obj1, obj2) {
    let value1 = obj1[key]
    let value2 = obj2[key]
    if (key === 'asset_name' || key === 'type' || key === 'agent') {
      value1 = value1.toLowerCase()
      value2 = value2.toLowerCase()
    }
    if (order === 'descending') {
      if (value1 > value2) {
        return -1
      } else if (value1 < value2) {
        return 1
      }
    } else {
      if (value1 < value2) {
        return -1
      } else if (value1 > value2) {
        return 1
      }
    }
    return 0
  }
}

function timeCompareByKey (key, order) {
  return function (obj1, obj2) {
    let value1 = obj1[key]
    let value2 = obj2[key]
    if (order === 'descending') {
      if (Date.parse(value1) > Date.parse(value2)) {
        return -1
      } else if (Date.parse(value1) < Date.parse(value2)) {
        return 1
      }
    } else {
      if (Date.parse(value1) < Date.parse(value2)) {
        return -1
      } else if (Date.parse(value1) > Date.parse(value2)) {
        return 1
      }
    }
    return 0
  }
}

function naturalCompareByKey (key, order) {
  let value1, value2
  return function (obj1, obj2) {
    if (key === 'schedule') {
      value1 = String(obj1[key]['type'])
      value2 = String(obj2[key]['type'])
    } else {
      value1 = String(obj1[key])
      value2 = String(obj2[key])
    }

    // We use "natural compare" here to match what the TOC UI is doing
    const comparisonValue = naturalCompare(value1.toLowerCase(), value2.toLowerCase())
    if (comparisonValue === 0) {
      return naturalCompare(value1, value2)
    }

    if (order === 'descending') {
      return comparisonValue * -1
    } else {
      return comparisonValue
    }
  }
}

function compareByKey (key, order) {
  // We have to special case sorting for these keys, because the TOC UI sorts them using a simple comparator and
  // doesn't use natural comparing.
  //
  // https://github.scm.tripwire.com/tw-mp/console/blob/7b024dabb54e04750fccac4ca662975bfb70091c/ui/src/operations/OperationsSorting.js#L62
  const simpleCompareKeyList = ['consoleuuid', 'oid', 'asset_id', 'asset_name', 'type', 'agent']
  if (simpleCompareKeyList.indexOf(key) > -1) {
    return simpleCompareByKey(key, order)
  } else if (key === 'next_start_24_hour' || key === 'last_start_24_hour' || key === 'taskEndTime') {
    return timeCompareByKey(key, order)
  }
  return naturalCompareByKey(key, order)
}

export function compareMultipleObjects () {
  // Save the arguments object as it will be overwritten, note that arguments object is an array-like object
  // consisting of the names of the properties to sort by
  const props = arguments
  return function (obj1, obj2) {
    let i = 0,
      result = 0,
      numberOfProperties = props.length
    // Try getting a different result from 0 (equal), as long as we have extra properties to compare
    while (result === 0 && i < numberOfProperties) {
      result = compareByKey(props[i])(obj1, obj2)
      i++
    }
    return result
  }
}

export function compareMultipleObjectsForAssetDescending () {
  // Save the arguments object as it will be overwritten, note that arguments object is an array-like object
  // consisting of the names of the properties to sort by
  const props = arguments
  return function (obj1, obj2) {
    let i = 0,
      result = 0,
      numberOfProperties = props.length
    // Try getting a different result from 0 (equal), as long as we have extra properties to compare
    while (result === 0 && i < numberOfProperties) {
      if (i === 0) {
        result = compareByKey(props[i], 'descending')(obj1, obj2)
      } else {
        result = compareByKey(props[i])(obj1, obj2)
      }
      i++
    }
    return result
  }
}

export function doesScrollBarExist () {
  return browser.executeScript('return document.documentElement.scrollHeight>document.documentElement.clientHeight;')
}

function browserExec (action, getElm) {
  return browser.executeScript(action, getElm)
}

function makeHiddenAttributeVisible (elm) {
  return browserExec('arguments[0].removeAttribute("hidden")', elm.getWebElement())
}

export function upLoadFile (filePath, page) {
  const fileName = page.getInputFile()
  makeHiddenAttributeVisible(fileName)
  fileName.sendKeys(filePath)
}

export function selectOption(selector, item){
    let desiredOption;

    selector.then(function findMatchingOption(options){
        options.some(function(option){
            option.getText().then(function doesOptionMatch(text){
                if (item === text){
                    desiredOption = option;
                    return true;
                }
            });
        });
    }).then(function clickOption(){
            if (desiredOption){
                desiredOption.click();
            }
        });
}

export function verifyEditedFields(row_elements, username, lasname){
    return row_elements.getText().then((rows) => {
        const len = rows.length;
        let i =0;
        for(i=0;i<len;i++){
            if(rows[i] == username){
                getElements.getElementByXpath("//div[@class='ReactVirtualized__Grid__innerScrollContainer']/div[%d]/div[2]"
                    .replace('%d',i+1).replace('%d',2)).getText().then(function(value){
                    expect(value).toBe(lasname);
                })
            }
        }
    })
}

export function switchToAnotherWindow(){
    let parentHandle = browser.getWindowHandle();
    let handles = browser.getAllWindowHandles();

    parentHandle.then(function (pHandle) {
        handles.then(function (allHandles) {
            for(let handle of allHandles){
                if(handle!=pHandle){
                    browser.close();
                    browser.switchTo().window(handle);
                    break;
                }
            }
        })
    })
}

export const buttonEnabledClass = 'ui button'
export const buttonPositiveClass = 'ui positive button'
export const buttonNegativeClass = 'ui negative button'
export const buttonDisabledClass = 'ui disabled button'
export const buttonPositiveDisabledClass = 'ui positive disabled button'
export const checkboxEnabledClass = 'ui checkbox'
export const checkboxCheckedClass = 'ui checked checkbox'
export const buttonPrimaryClass ='ui primary button'
