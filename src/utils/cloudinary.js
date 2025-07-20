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

const deleteFromCloudinary = async (cloudinaryFilePath) => {

    try {
        if(!cloudinaryFilePath){
            return null  //No file Found
        }
        // Deleting file on cloudinary
        const isVideo = cloudinaryFilePath.includes(".mp4") || cloudinaryFilePath.includes(".mov");
        const resourceType = isVideo ? "video" : "image";

        const publicId = cloudinaryFilePath.split("/").pop().split(".")[0]; // get file name without extension

        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });
        if (response.result !== "ok") {
            console.warn("Cloudinary deletion warning:", response);
        }
        // File Deleted Successfully
        return response
        
    } catch (error) {
        console.error("Cloudinary deletion error:", error);
        return null;
    }  
};

export {uploadOnCloudinary, deleteFromCloudinary}

