const pageUrl = 'https://openweathermap.org/'

const DESIRED_WINDOW_WIDTH = 1600
const DESIRED_WINDOW_HEIGHT = 1200


export default class HomePage {
  go () {
    browser.driver.get(pageUrl)
  }

  getUrl () {
    return pageUrl
  }

  getTitle() {
    return browser.driver.getTitle()
  }

  getSearchButton () {
    return element(by.className('btn btn-orange'))
  }

  getSearchBox () {
    return element(by.xpath('//div[@class="form-group search-cities__block"]/input[@id="q"]'))
  }


  getSupportCenterLink () {
    return element(by.linkText('Support Center'))
  }

  getSignInLink () {
    return element(by.linkText('Sign In'))
  }

  getSignUPLink () {
    return element(by.linkText('Sign Up'))
  }

  getCelciusCoverterLink () {
    return element(by.id('metric'))
  }

  getFahrenheitCoverterLink () {
    return element(by.id('imperial'))
  }

  getAlertWarningText(){
    return element(by.xpath("//div[@class='alert alert-warning']")).getText()
  }

  getCityNameForTempSearch(){
    return element(by.xpath("//div[@id='forecast_list_ul']/table[@class='table']/tbody/tr[1]/td[2]/b/a")).getText()
  }
}
