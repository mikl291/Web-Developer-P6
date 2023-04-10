const mongoose = require("mongoose")
const uniqueValidator = require("mongoose-unique-validator")

const username = process.env.MONGODB_USERNAME // Récupère le USERNAME 
const password = process.env.MONGODB_PASSWORD // Récupère le PASSWORD
const database = process.env.MONGODB_DATABASE // Récupère le nom de la DATABASE
const uri = `mongodb+srv://${username}:${password}@cluster0.xvoumk2.mongodb.net/${database}?retryWrites=true&w=majority` // URI = Lien de connexion MONGODB


mongoose
  .connect(uri)
  .then(() => console.log("Connected to Mongo!"))
  .catch((err) => console.error("Error connecting to Mongo: ", err))

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
})
userSchema.plugin(uniqueValidator)

const User = mongoose.model("User", userSchema)

module.exports = { mongoose, User }