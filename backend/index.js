mport express from 'express';
import DB from './db.js'

const PORT = process.env.PORT || 3000;

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



initDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        })
    })