const multer = require("multer");
const path = require("path");

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads"); // Destination folder for storing uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname) // Unique filename
  },
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true); // Accept file
  } else {
    cb(new Error("Only images are allowed"), false); // Reject file
  }
};
// Initialize multer instance
const upload = multer({ storage,});

module.exports = upload;
