import HomePage from './page/HomePage'

describe('Weather app home page', function() {
    let homePage

    beforeAll(function () {
        homePage = new HomePage();
        browser.waitForAngularEnabled(false);


    });

    beforeEach(function () {
        homePage.go();
    });


    it('Displays temperature for a valid city name', function() {
        homePage.getSearchBox().sendKeys("Mumbai")
        homePage.getSearchButton().click()
        expect(homePage.getCityNameForTempSearch()).toContain('Mumbai')
    });


});
