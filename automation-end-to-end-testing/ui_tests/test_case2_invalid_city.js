import HomePage from './page/HomePage'

describe('Weather app home page', function() {
    let homePage

    beforeAll(function () {
        homePage = new HomePage();
        browser.waitForAngularEnabled(false);
        homePage.go();

    });

    // afterAll(function () {
    //     browser.driver.close();
    // });

    it('Displays Not found result for invalid city name', function() {
        homePage.getSearchBox().sendKeys("khgllajgla")
        homePage.getSearchButton().click()
        expect(homePage.getAlertWarningText()).toEqual('×\nNot found')
    });


});