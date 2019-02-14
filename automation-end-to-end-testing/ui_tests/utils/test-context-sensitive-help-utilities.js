export function getContextSensitiveHelp (element, expectUrlInfo, contextSensitiveHelp) {
  let loc = element.getLocation()
  // takes the mouse to hover the element. Only works on Chrome right now
  // TODO: Update selenium docker images once mouseMoveTo event works in geckodriver
  //  https://github.com/angular/protractor/issues/4177
  browser.driver
    .actions()
    .mouseMove(loc)
    .perform()
  browser.driver
    .actions()
    .click(protractor.Button.RIGHT)
    .perform()

  browser.driver.sleep(1000)
  contextSensitiveHelp.getHelp().click()
  browser.driver.sleep(1000)

  // Be sure to close the new tab this opens, otherwise subsequent tests will fail, as the new tab gets the focus
  browser.driver.getAllWindowHandles().then(function (handles) {
    browser.driver.switchTo().window(handles[1])
    browser.driver.sleep(1000)
    const currentUrl = browser.driver.getCurrentUrl()
    expect(currentUrl).toContain(expectUrlInfo)

    browser.driver.close()
    browser.driver.switchTo().window(handles[0])
  })
}
