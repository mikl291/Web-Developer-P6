const mongoose = require("mongoose")
const {unlink} = require("fs/promises")


const productSchema = new mongoose.Schema ({
    userId: String,
    name: String,
    manufacturer: String,
    description: String,
    mainPepper: String,
    imageUrl: String,
    heat: Number,
    likes: Number,
    dislikes: Number,
    usersLiked: [ String ],
    usersDisliked: [ String ]
})
const Product = mongoose.model("product", productSchema)

function getSauces (req, res) { // Fonction pour obtenir les sauces dispo
    //Pour vider la DB d'un coup a mettre avant le res.send
    // Product.deleteMany({}).then(console.log).catch(console.error)
    Product.find({})
        .then(products => res.send(products)) // Récupère la totalité de la DB       
        .catch(error => res.status(500).send(error))
}

// Cette fonction renvoie le produit avec l'identifiant donné
function getSauceId (req, res) {
    const { id } = req.params
  return Product.findById(id)
}

// Cette fonction utilise la fonction getSauceId pour récupérer 
// le produit avec l'identifiant donné, puis l'envoie au client.
function getSauceById(req, res) {
    getSauceId(req, res)
        .then((product) => sendClientResponse(product, res))
        .catch((err) => res.status(500).send(err))
}

// Cette fonction supprime une sauce à partir de son ID
function deleteSauce(req, res) {
    const id = req.params.id
    Product.findByIdAndDelete(id) // Cherche et supprime le produit par l'id
        .then((product) => sendClientResponse (product, res))
        .then((item) => deleteImage(item))
        .then((res) =>console.log("Image supprimé"))
        .catch(err => res.status(500).send({message: err})) // Une erreur s'est produite
    }

function modifySauce(req, res) {
    // Recupère les données de la requete
    const {
        params: {id}
    } = req

    const { body } = req
    console.log("Modifications en cours...:", body, id)
    console.log("Descriptif de la nouvelle image:", req.file)
    // regarde si il y a un "req.file"
    const hasNewImage = req.file != null // en cas de isNewImage different de null
    // fabrique "createModifiedImage"
    const modifiedImage = createModifiedImage(hasNewImage, req)
    Product.findByIdAndUpdate(id, modifiedImage) // Update DB
        //  Si la réponse est null envoi un  404
            .then((dbReponse) => sendClientResponse(dbReponse, res)) // regarde la reponse a envoyer au client
            .then((product) => deleteImage(product))
            .then((res) =>console.log("Image supprimée de la DB", res))
            .catch((err) => console.error("Problème lors de l'update", err))
}

// Fonction qui fabrique "createdModifiedImage"
function createModifiedImage(isNewImage, req) {
    console.log("L'image a était modifiée:", isNewImage)
    if (!isNewImage) return req.body
    const modifiedImage = JSON.parse(req.body.sauce)
    modifiedImage.imageUrl = makeFileUrl(req, req.file.fileName)
    console.log("NOUVELLE IMAGE A GERER")
    console.log(modifiedImage)
    return modifiedImage
  }

// Fonction qui supprime les images 
function deleteImage(product) {
    if (product == null) return
    console.log("Détail de l'image modifiée", product)
    const imageToDelete = product.imageUrl.split("/").at(-1)
    return unlink("images/" + imageToDelete)
}


// Verifie si le produit n'a pas été supprimé/modifié dans la DB manuellement
function sendClientResponse(product, res) {  
    if(product == null) { // Si le produit est = null
        console.log("Mise à jour impossible.")
        return res.status(404).send({message: "Object not found in database."})
    } 
    console.log("Mise à jour de:", product)
    return Promise.resolve(res.status(200).send(product)).then(
        () => product)
}

// fonction pour creer  le fichier dans l'Url 
function makeFileUrl(req, fileName) {
    return req.protocol + "://" + req.get("host") + "/images/" + fileName
  }

function createSauce(req, res) {
    const sauce = JSON.parse(req.body.sauce) // Requete qui lance le parse pour recuperer un objet
    
    // Variable du formulaire
    const name = sauce.name
    const manufacturer = sauce.manufacturer
    const description = sauce.description
    const mainPepper = sauce.mainPepper
    const heat = sauce.heat
    const userId = sauce.userId
    const imageUrl = req.file.filename

    const product = new Product ({
        userId,
        name,
        manufacturer,
        description,
        mainPepper,
        imageUrl: makeFileUrl(req, imageUrl),
        heat,
        likes: 0,
        dislikes: 0,
        usersLiked: [],
        usersDisliked: []
    })
    product
        .save()
        .then((message) => {
            res.status(201).send({message: message})
            return console.log("Produit enregistré!", message)
        })
        .catch(console.error)
}

// fonction pour creer/supprimer un like

function likeSauce(req, res) {
    const like = req.body.like
    const {userId} = req.body
    // Vérifie si la valeur de like est valide
    //  si la valeur n'est pas égale a 0,-1,1 retourne le message
    if (![0, -1, 1].includes(like)) return res.status(403).send({message: "Valeur de like invalide"})
    
    getSauceId(req, res)
        // Met à jour les valeurs de likes et dislikes de la sauce
        .then((product) => updateValue (product, like, userId, res))
        // Enregistre les modifications dans la base de donnée
        .then(pr => pr.save())  
        .then((prod) => sendClientResponse(prod, res))
        .catch((err) => res.status(500).send(err))
}

// Cette fonction met à jour le vote d'une sauce en fonction de l'utilisateur qui a effectué l'action.
function updateValue(product, like, userId, res) {
    if (like === 1 || like === -1) return likeDislike(product, userId, like)
    return resetVote(product, userId, res)
}

// Cette fonction réinitialise le vote d'une sauce en fonction de l'utilisateur qui a effectué l'action.
function resetVote(product, userId, res) {
    const { usersLiked, usersDisliked } = product
    if ([usersLiked, usersDisliked].every((arr) => arr.includes(userId)))
    // Vérifie si l'utilisateur a déjà voté dans les deux sens
      return Promise.reject("Le vote de peut s'effectuer des deux cotés")
    // Vérifie si l'utilisateur a déjà voté
    if (![usersLiked, usersDisliked].some((arr) => arr.includes(userId)))
      return Promise.reject("Une erreur s'est produite, il semble qu'aucun vote ne soit effectué.")
    // Réinitialise le vote de l'utilisateur pour cette sauce
    if (usersLiked.includes(userId)) {
      --product.likes
      product.usersLiked = product.usersLiked.filter((id) => id !== userId)
    } else {
      --product.dislikes
      product.usersDisliked = product.usersDisliked.filter((id) => id !== userId)
    }
  
    return product
  }
// Cette fonction met à jour le vote d'une sauce en fonction de l'utilisateur qui a effectué l'action.
function likeDislike(product, userId, like) {
    const {usersLiked, usersDisliked} = product
    const voteChoice = like === 1 ? usersLiked : usersDisliked
    // Vérifier si l'utilisateur a déjà voté pour cette sauce
    if (voteChoice.includes(userId)) return product
    // Ajouter l'ID de l'utilisateur au tableau correspondant
    voteChoice.push(userId)
    // Incrémenter le compteur de likes ou de dislikes en fonction de la valeur du like
    like === 1 ? ++product.likes : ++ product.dislikes
    return product
}

module.exports = { getSauceId, sendClientResponse, getSauces, createSauce, getSauceById, deleteSauce, modifySauce, likeSauce }
  
  