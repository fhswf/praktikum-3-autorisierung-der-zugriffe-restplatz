import express from 'express';
import passport from 'passport';
import KeycloakBearerStrategy from 'passport-keycloak-bearer';
import DB from './db.js'

const PORT = process.env.PORT || 3000;
passport.use(new KeycloakBearerStrategy({
    realm: 'webentwicklung',
    url: 'https://jupiter.fh-swf.de/keycloak',
    clientId: 'my-client-id',
    clientSecret: 'my-client-secret',
    realmPublicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtTnTjWz9s7vA9lCBQGry/1WWc6uF7VbZC6UQ7M1H9Y0X7VzKoJ/Ypb0p+Fy+TNKj0pZ+n46x1xh4ex3jK/FXIHv5aR6FzDYENPymz+8KwZGsg+C46xup4J3qK5X5g5OUmRmxbhS5J5nmsiruV/EB39nwC2QV7lGWYAvX9y7KjJ/cFbVdweORgJ8fTDxECDIlAh0r1gGst7mq8H0EoVQjKikgCUu3Ilq8ehxqof/xVmTYCz6KjWQ8oOv00XO5l5+aKnyoWw/b90ZSZxE5MujZOzNak/CfykFEjF1N9d/uyfxSKvy/iNblw2a8WsBN/KeQ2tDRSjjzY3qKmLPv9frs4FwIDAQAB',
    tokenUrl: 'https://jupiter.fh-swf.de/keycloak/realms/webentwicklung/protocol/openid-connect/token',
    userInfoUrl: 'https://jupiter.fh-swf.de/keycloak/realms/webentwicklung/protocol/openid-connect/userinfo',
    realmUrl: 'https://jupiter.fh-swf.de/keycloak/realms/webentwicklung'
  }, (token, done) => {
    // Hier können Sie die Validierung des Tokens durchführen, z.B. Überprüfung der Signatur
    done(null, { sub: token.sub });
  }));


/** Zentrales Objekt für unsere Express-Applikation */
const app = express();
app.use(express.json());
/** global instance of our database */
let db = new DB();

/** Initialize database connection */
async function initDB() {
    await db.connect();
    console.log("Connected to database");
}

// implement API routes

/** Return all todos. 
 *  Be aware that the db methods return promises, so we need to use either `await` or `then` here! 
 */
app.get('/todos', async (req, res) => {
    let todos = await db.queryAll();
    res.send(todos);
});

/** Return todo by given id. 
 */
app.get('/todos/:id', async (req, res) => {
    let todos = await db.queryById(req.params.id);
    console.log(todos)
    res.send(todos);
});

app.put('/todo/:id' , async(req,res) =>{
    let ret = await db.update(req.params.id, req.body);
    res.send(ret);
});

app.post('/todo', async(req,res) =>{
    let ret = await db.insert(req.body);
    res.send(ret);
});

app.delete('/todo/:id', async(req,res) =>{
    let ret = await db.delete(req.params.id);
    res.send(ret);
})

app.get('/', async (req, res) => {
    res.send("nix los");
});

app.post('/login', passport.authenticate('keycloak', {
    successRedirect: '/a',
    failureRedirect: '/b',
  }));
initDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        })
    })