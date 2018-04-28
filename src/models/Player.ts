const uuid = require('uuid');

export default class Player {
    name: string;
    displayName: string;
    total: number;
    currentTerm: string

    id: string;


    constructor(num: number) {
        this.id =  uuid()
        this.displayName = 'Player ' + num;
        this.total = 0;
        this.currentTerm = '';
    }

    updateDisplayName(name: string) {
        this.displayName = name;
    }

}