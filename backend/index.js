import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import session from 'express-session';
import KeycloakBearerStrategy  from 'passport-keycloak-bearer';
import passportJWT from 'passport-jwt'
import DB from './db.js'

const PORT = process.env.PORT || 3000;

const publicKey = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyn2vP592Ju/iKXQW1DCrSTXyQXyo11Qed1SdzFWC+mRtdgioKibzYMBt2MfAJa6YoyrVNgOtGvK659MjHALtotPQGmis1VVvBeMFdfh+zyFJi8NPqgBTXz6bQfnu85dbxVAg95J+1Ud0m4IUXME1ElOyp1pi88+w0C6ErVcFCyEDS3uAajBY6vBIuPrlokbl6RDcvR9zX85s+R/s7JeP1XV/e8gbnYgZwxcn/6+7moHPDl4LqvVDKnDq9n4W6561s8zzw8EoAwwYXUC3ZPe2/3DcUCh+zTF2nOy8HiN808CzqLq1VeD13q9DgkAmBWFNSaXb6vK6RIQ9+zr2cwdXiwIDAQAB';


const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;



/** Zentrales Objekt für unsere Express-Applikation */
const app = express();
app.use(express.json());

/** global instance of our database */
let db = new DB();
app.use(session({
   secret: 'my-secret-key',
   resave: false,
   saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((user, done) => done(null, user))

passport.use(new KeycloakBearerStrategy({
   realm: 'webentwicklung',
   url: 'https://jupiter.fh-swf.de/keycloak'
}, (token, done) => {
   try { 
      //const tokenStr = JSON.stringify(token);
      //const decoded = jwt.verify(tokenStr, publicKey, { algorithms: ['RS256'] });

      db.getUserByName(token.preferred_username)
        .then((rslt) => {return done(null, rslt);})
        .catch((err) => {return done(null, false);});
      
    } catch (error) {
      console.error(error);
      return done(null, false);
    }
}));


const authmw =passport.authenticate('keycloak', { session: true })

app.get('/protected', authmw, (req, res) => {
   console.log(req.user)
   res.send('Hello from protected area!');
});


/** Initialize database connection */
async function initDB() {
    await db.connect();
    console.log("Connected to database");
}

async function checkTDAccess(todoID,userID){
    let todo = await db.queryById(todoID);
    if(todo.user_id === userID){
        return true;
    }
    return false;

}

// implement API routes

/** Return all todos. 
 *  Be aware that the db methods return promises, so we need to use either `await` or `then` here! 
 */
app.get('/todos', authmw, async (req, res) => {
    let todos = await db.queryAll();
    res.send(todos);
});

/** Return todo by given id. 
 */
app.get('/todos/:id', authmw ,async (req, res) => {
    
    if(! (await checkTDAccess(req.params.id,req.user.id))){
        res.sendStatus(401);
        return;
    }
    let todos = await db.queryById(req.params.id);
    res.send(todos);
});



app.put('/todo/:id' ,authmw, async(req,res) =>{
    if(! (await checkTDAccess(req.params.id,req.user.id))){
        res.sendStatus(401);
        return;
    }
    let ret = await db.update(req.params.id, req.body);
    res.send(ret);
});

app.post('/todo', authmw, async(req,res) =>{ 
    let ret = await db.insert(req.body);
    res.send(ret);
});

app.delete('/todo/:id', authmw,async(req,res) =>{
    if(! (await checkTDAccess(req.params.id,req.user.id))){
        res.sendStatus(401);
        return;
    }
    let ret = await db.delete(req.params.id);
    res.send(ret);
})


app.get('/', async (req, res) => {
    res.send("nix los");
});



initDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        })
    })