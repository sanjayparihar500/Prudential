import fs from 'fs'

export default class UsersJson {
    constructor() {
        this.sourceFile = fs.readFileSync('./resources/users.json')
        this.jsonContents = JSON.parse(this.sourceFile)
    }

    getAllContents() {
        return this.jsonContents
    }

    getListOfValuesByKey(keyName) {
        return this.jsonContents[keyName]
    }
}

