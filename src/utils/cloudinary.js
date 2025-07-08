import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"
cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.API_KEY, 
    api_secret: process.env.API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {

    try {
        if(!localFilePath){
            return null  //No file Found
        }
        // Uploading file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // File Uploaded Successfully
        console.log("File is uploaded on cloudinary ", response.url);
        return response
        
    } catch (error) {
        // Remove Locally saved temporary file if the upload operation failed
        fs.unlinkSync(localFilePath)
        return null;
    }
    
    
    
    
};

export {uploadOnCloudinary}

