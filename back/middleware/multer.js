const multer = require('multer')

const storage = multer.diskStorage({
  destination: "images/",
  filename: function (req, file, cb) {
    cb(null, makeFilename(req, file))
  }
})
  
function makeFilename(req, file) { // renomme le fichier en JJMMAAAA_HHMMSS-origalname
  const currentDate = new Date().toLocaleString().replace(/[^\w\s]/g, '').replace(/\s+/g, '_')
  const fileName = `${currentDate}-${file.originalname}`.replace(/\s/g, "-")
  file.fileName = fileName
  return fileName 
}

const upload = multer({ storage })

module.exports = {upload}