import GetElements from '../page/GetElementUtilities'
import {waitForElementToBePresent} from '../utils/test-utilities'
import UserActivityLogPage from '../page/UserActivityLogPage'
const getElements = new GetElements()
const userActivityLogPage = new UserActivityLogPage()


export function clickCheckboxByUsername(row_elements, username) {

    row_elements.getText().then((rows) => {
        let len = rows.length;
        let i =0;
        let flag = false;
        for(i=0;i<len;i++){
            if(rows[i] === username){
                userActivityLogPage.clickCheckBox(i);
                flag = true;
                break;
            }
        }
        if(flag==false){
            userActivityLogPage.getNextPaginationButton().click();
            browser.sleep(10000);
            waitForElementToBePresent(userActivityLogPage.getRowCheckbox(1));
            let webElements = userActivityLogPage.getTableRowsByUserNameColumn();
            userActivityLogPage.clickCheckboxByUsername(webElements, username)
        }
    });

}


export function verifyStatusByUsername(row_elements, username, expected_status) {

    row_elements.getText().then((rows) => {
        let len = rows.length;
        let i =0;
        let flag = false;
        for(i=0;i<len;i++){
            if(rows[i] == username){
                expect(userActivityLogPage.getStatusCellByRowIndex(i).getText()).toBe(expected_status);
                flag=true;
                break;
            }
        }
        if(flag==false){
            userActivityLogPage.getNextPaginationButton().click();
            browser.sleep(10000);
            waitForElementToBePresent(userActivityLogPage.getRowCheckbox(1));
            let webElements = userActivityLogPage.getTableRowsByUserNameColumn();
            verifyStatusByUsername(webElements, username, expected_status)
        }
    });

}

export function clickCheckBox(index){
    browser.executeScript('arguments[0].click();', userActivityLogPage.getRowCheckbox(index+1));
}

export function getNavItemClassAttribute(item_index){
    return getElements.getElementByXpath("//*[contains(@class, 'nav_item')][%d]".replace('%d', item_index)).getAttribute("class");
}

export function verifySortedColumnCellValues(){
    let xpathUserNameColumnData = "//div[contains(@class,'ReactVirtualized__Table__row')][%d]/div[3]/div".replace('%d',1)

    getElements.getElementByXpath(xpathUserNameColumnData).getText().then(function (firstText) {

        xpathUserNameColumnData = xpathUserNameColumnData.replace(1,2)

        getElements.getElementByXpath(xpathUserNameColumnData).getText().then(function (secondText) {

            let diff = firstText.localeCompare(secondText)
            expect(diff).not.toBe(0)
        })
    })
}

export function verifyUserListElements(){
    let flag = userActivityLogPage.getLeftPaginationButton().isDisplayed()
    assertResult(flag)
    flag = userActivityLogPage.getRightPaginationButton().isDisplayed()
    assertResult(flag)
    flag = userActivityLogPage.getNextPaginationButton().isDisplayed()
    assertResult(flag)
    flag = userActivityLogPage.getPrevPaginationButton().isDisplayed()
    assertResult(flag)
    flag = userActivityLogPage.getInputPagination().isDisplayed()
    assertResult(flag)
    flag = userActivityLogPage.getHighDensityButton().isDisplayed()
    assertResult(flag)
    flag = userActivityLogPage.getLowDensityButton().isDisplayed()
    assertResult(flag)
}

export function assertResult(flag){
    expect(flag).toBe(true)
}

export function verifyHeaderElement(){
    expect(userActivityLogPage.getUserHeader().getText()).toBe('Users')
}

export function navigateToUseListTable(){
    userActivityLogPage.getGlobalSettingsLink().click()
    userActivityLogPage.getTab("Users").click()
}

export function verifyElementsByText(elementTextArray, webElements){

    webElements.then(function (elements) {
        let i =0;
        elements.forEach(function (element) {
            element.isDisplayed().then(function (flag) {
                expect(flag).toBe(true)
            })
            element.getText().then(function (actualText) {
                expect(actualText).toBe(elementTextArray[i])
                i++;
            })
        })
    })
}
