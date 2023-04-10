const jwt = require("jsonwebtoken")

function authUser(req, res, next) { // Accepte ou refuse l'authentification de l'user
    //console.log("header", header)
    const header = req.header("Authorization") // Obtient le contenue d' "Authorization" 
    if (header == null) return res.status(403).send({message: "Invalid"})
    
    const token = header.split(" ")[1] // Sépare le token de l'user id
    if (token == null) return res.status(403).send({message: "Le token ne peut être null!"})

    jwt.verify(token, process.env.JWT_PASSWORD, (err, decoded) => {
        if (err) return res.status(403).send({message: "Token invalid" + err})
        next()
    })
}

module.exports = {authUser}