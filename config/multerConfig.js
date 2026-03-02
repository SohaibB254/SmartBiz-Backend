const multer = require('multer')
const fs = require('fs')
const path = require('path')

const storage = multer.diskStorage({
    //setup destination path
    destination:(req,file,cb)=>{
        let uploadPath;
        if(req.uploadType == "business"){
            uploadPath = 'uploads/business'
        }else if(req.uploadType == "product"){
            uploadPath = 'uploads/products'
        }
        else if(req.uploadType == "service"){
            uploadPath = 'uploads/services'
        }else{
            uploadPath = 'uploads'
        }
        //Check if the folder exists
        fs.mkdirSync(uploadPath, {recursive: true});
        cb(null, uploadPath)
    },
    //Setup unique filename
    filename: (req, file,cb)=>{
        const uniqueSuffix = Date.now() +   path.extname(file.originalname);
        cb(null, file.fieldname + "-" + uniqueSuffix)
    }
})

const upload = multer({storage})
module.exports = upload