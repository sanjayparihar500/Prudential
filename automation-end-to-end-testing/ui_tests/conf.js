exports.config = {
    framework: 'jasmine',
    // seleniumAddress: 'http://localhost:4444/wd/hub',
    specs: ['test_case1.js'],
    capabilities: {
        browserName: 'firefox'
    },
    onPrepare: function () {
        // Enable ES6 support in the tests
        require('babel-core/register')({
            presets: ['env']
        })

        // Don't wait for AngularJS to show up
        browser.ignoreSynchronization = true
    }
}
