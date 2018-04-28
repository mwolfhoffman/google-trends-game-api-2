import { Request, Response, NextFunction, Router} from 'express'
const router = Router();

router.route('/test')
    .get((req:any, res:any, next:any) => {
        res.send({'type': 'test', 'data': 'this is just a test for the API controller.'})
    })
    
module.exports.router = router;
