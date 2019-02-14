exports.config = {
  plugins: [
    {
      package: 'jasmine2-protractor-utils',
      disableHTMLReport: true,
      disableScreenshot: false,
      screenshotPath: './ui_tests/screenshots',
      screenshotOnExpectFailure: true,
      screenshotOnSpecFailure: false,
      clearFoldersBeforeTest: false,
      htmlReportDir: './ui_tests/htmlReports'
    }
  ],
  framework: 'jasmine',
  seleniumAddress: 'http://localhost:4444/wd/hub',
  multiCapabilities: [
    {
      browserName: 'firefox',
      marionette: true,
      acceptSslCerts: true,
      acceptInsecureCerts: true,
      trustAllSSLCertificates:true,
      'moz:firefoxOptions': {
          'args': ['--safe-mode','--allow-insecure-localhost']
        }
    },
    {
      browserName: 'chrome'
    }
  ],
  jasmineNodeOpts: {
    defaultTimeoutInterval: 120000
  },
  onPrepare: function () {
    // Enable ES6 support in the tests
    require('babel-core/register')({
      presets: ['env']
    })

    // Don't wait for AngularJS to show up
    browser.ignoreSynchronization = true

    // Add JUnit style text output
    const now = new Date().getTime()
    const jasmineReporters = require('jasmine-reporters')
    jasmine.getEnv().addReporter(
      new jasmineReporters.JUnitXmlReporter({
        consolidateAll: true,
        savePath: './ui_tests/reports',
        filePrefix: 'test-results-' + now
      })
    )
  }
}
