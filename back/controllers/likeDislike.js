export function likeSauce
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

