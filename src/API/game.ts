import * as express from 'express';
import Player from '../models/player';
import Query from '../models/query';

export const router = express.Router();

let totalPlayers;

/* Send search query in req.body in a searches property
example : 
    {"searches":{
        "player1's id": "searchterm 1",
        "player2's id": "searchterm 2"
    }} */
router.post('/search/', (req, res) => {
    let searchResult;
    let currentResult;
    let q = new Query(req.body.searches);
    let searchesValidated = q.validateSearchTerms();

    if (searchesValidated) {
        var arr: string[] = [];
        for (var key in q.searches) {
            arr.push(q.searches[key]);
        }

        q.runQuery(arr)
            .then((data: any) => {
                var keys = Object.keys(data);
                var json = JSON.parse(data);
                var averages = json.default.averages;
                res.send(averages);
            })
            .catch((error: Error) => { throw error });
    }
})

const formatSearchResults = (res: any) => {
    return res;
};


router.get('/new-players/:count', (req, res) => {
    let players = [];
    let count = req.params.count;
    totalPlayers = count;
    let n = 1;

    if (count > 4) {
        throw new Error("Can only play with a maximum of 4 players!");
    }

    if (count < 2) {
        throw new Error("You need at least 2 players to play this game.");
    }

    while (count > (n - 1)) {
        let newPlayer = new Player(n);
        players.push(newPlayer);
        n++;
    }
    res.send(players);
});