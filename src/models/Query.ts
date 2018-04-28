const googleTrends =require('google-trends-api');

export default class Query {
    searches:string[];
    queryString:string;

    constructor(searches:string[]) {
        this.searches = searches;
        this.queryString = '';
    }

    validateSearchTerms() {
        for (var key in this.searches) {
            let termArr = this.searches[key].split(" ");
            if (termArr.length !== 2) {
                throw new Error(`You're search term must be 2 words. ${key} did not search for 2 words.`)
            }
        }
        return true;
    }

    runQuery(terms:string[]) {
        var start = new Date(Date.now() - (86400000 * 365));
        return new Promise((resolve, reject) => {
            googleTrends.interestOverTime({ keyword: terms, startTime: start })
                .then((data:any) => {
                    return resolve(data);
                }).catch((err:Error) => { return reject(err) })
        })
    }
}