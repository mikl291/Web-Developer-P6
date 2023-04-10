const {app, express} = require("./server")
const {saucesRouter} = require("./routers/sauce.routers")
const {authRouter} = require("./routers/authRouter")
const port = 3000
const path = require('path')
const bodyParser = require('body-parser')

// connexion DB
require("./mongo")



// Middleware
app.use(bodyParser.json())

app.use("/api/sauces", saucesRouter)
app.use("/api/auth", authRouter)

// ROUTES


app.get("/", (req, res) => res.send("Welcome!"))



// ECOUTEURS
 // Requete sur image qui donne dans le nom de l'image dans l'url
app.use("/images", express.static(path.join(__dirname, "images")))
// Ecouteur  qui donne le port utilisé
app.listen(port, () =>  console.log("listening on port " + port))