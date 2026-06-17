const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const config = require("../config");
const fs = require("fs");

const hasCloudinary = !!(config.cloudinary && config.cloudinary.cloud_name && config.cloudinary.api_key && config.cloudinary.api_secret);

let storage;
if (hasCloudinary) {
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'coffee-pos',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'avif'],
      public_id: (req, file) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        return `img-${uniqueSuffix}`;
      }
    },
  });
} else {
  const uploadDir = "./public/images";
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = file.originalname.split('.').pop();
      cb(null, `img-${uniqueSuffix}.${ext}`);
    }
  });
}

const uploadFile = multer({ storage: storage });
module.exports = uploadFile;
