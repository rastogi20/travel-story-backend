const v2 = require('cloudinary');
const fs = require('fs');


v2.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
       console.log(localFilePath) 
      if (!localFilePath) return null
        // upload file on cloudinary
        const response = await v2.uploader.upload(localFilePath, {resource_type: "auto"})
        
        // file uploaded successfully
        console.log("File uploaded successfully", response.url);

        fs.unlinkSync(localFilePath)
        return response;

;    } catch (error) {
        console.log(error)
        fs.unlinkSync(localFilePath) /* unlink file on cloudinary as the operation for 
        uploading got failed*/
        return null;
    }
} 



module.exports = {uploadOnCloudinary}