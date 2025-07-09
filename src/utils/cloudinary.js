import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {

    try {
        if(!localFilePath){
            return null  //No file Found
        }
        // Uploading file on cloudinary
        // console.log("Uploading file to Cloudinary:", localFilePath);
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // File Uploaded Successfully
        // console.log("File is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response
        
    } catch (error) {
        // Remove Locally saved temporary file if the upload operation failed
        // console.error("❌ Cloudinary upload failed:", error.message);
        fs.unlinkSync(localFilePath)
        return null;
    }  
};

export {uploadOnCloudinary}

