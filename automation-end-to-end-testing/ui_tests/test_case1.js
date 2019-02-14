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

    it('Has Сurrent weather and forecast - OpenWeatherMap as title', function() {
        expect(homePage.getTitle()).toBe('Сurrent weather and forecast - OpenWeatherMap')

    });

    it('Has Search button with expected button name', function() {
        expect(homePage.getSearchButton().getText()).toEqual('Search')

    });

    it('Has weather search text box with expected placeholder', function() {
        expect(homePage.getSearchBox().getAttribute('placeholder')).toEqual('Your city name')

    });

    it('Has Support Center Link with expected link text', function() {
        expect(homePage.getSupportCenterLink().getText()).toEqual('Support Center')

    });

    it('Has sign in link with expected link text', function() {
        expect(homePage.getSignInLink().getText()).toEqual('Sign In')

    });
    it('Has sign up link with expected link text', function() {
        expect(homePage.getSignUPLink().getText()).toEqual('Sign Up')

    });

    it('Has celsius converter link with expected link text', function() {
        expect(homePage.getCelciusCoverterLink().getText()).toEqual('°C')

    });

    it('Has Fahrenheit converter link with expected link text', function() {
        expect(homePage.getFahrenheitCoverterLink().getText()).toEqual('°F')

    });

});
