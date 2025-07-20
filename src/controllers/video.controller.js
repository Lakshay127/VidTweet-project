import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponses.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"

const convertToSeconds = (durationStr) => {
  const [minutes, seconds] = durationStr.split(":").map(Number);
  return minutes * 60 + seconds;
};


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const match = {};
    
    if (query) {
        match.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ];
    }

    if (userId && isValidObjectId(userId)) {
        match.owner = new mongoose.Types.ObjectId(userId);
    }

    const sort = {};
    sort[sortBy] = sortType === "asc" ? 1 : -1;

    const pipeline = [
        { $match: match },
        { $sort: sort },
    ];
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const videos = await Video.aggregatePaginate(Video.aggregate(pipeline), options);

    if (!videos || videos.docs.length === 0) {
        throw new ApiError(404, "No videos found");
    }

    return res.status(200).json(new ApiResponse(200, videos, "Videos fetched successfully"));

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, duration} = req.body
    // TODO: get video, upload to cloudinary, create video
    if([title, description, duration].some((field) => field.trim() === "")){
        throw new ApiError(400, "All Fields are required")
    }
    const videoLocalPath = req.files?.videoFile?.[0].path;
    if(!videoLocalPath){
        throw new ApiError(400, "Video File is required in Local path")
    }
    const videoPath = await uploadOnCloudinary(videoLocalPath)
    if(!videoPath){
        throw new ApiError(400, "Video File is required in Cloudinary path")
    }
    const thumbnailLocalPath = req.files?.thumbnail?.[0].path;
    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail File is required in Local path")
    }
    const thumbnailPath = await uploadOnCloudinary(thumbnailLocalPath)
    if(!thumbnailPath){
        throw new ApiError(400, "Thumbnail File is required in Cloudinary path")
    }
    // Check for authenticated user
    if (!req.user || !req.user._id) {
        throw new ApiError(401, "Unauthorized: User ID is missing");
    }

    const owner = req.user._id;
    const numericDuration = convertToSeconds(duration); 

    const video = await Video.create({
        videofile : videoPath.url,
        thumbnail: thumbnailPath.url, 
        title,
        description, 
        duration: numericDuration,
        owner
    })
    const createdVideo = await Video.findById(video._id).select(
        "-thumbnail "
    )
    if(!createdVideo){
        throw new ApiError(500, "Error in creating video")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, createdVideo, "Video published Successfully"))

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    const video = await Video.findById(videoId).populate("owner", "username email")
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    const video = await Video.findById(videoId)
    if (!video) {   
        throw new ApiError(404, "Video not found")
    }
    const { title, description } = req.body
    if (!title || !description) {
        throw new ApiError(400, "All fields are required")
    }
    const thumbnailLocalPath = req.file?.path;
    const oldThumbnail = video.thumbnail
    if (oldThumbnail) {
        await deleteFromCloudinary(oldThumbnail)
    } 
    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail file is required in Local Path")
    }
    const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if(!uploadedThumbnail){
        throw new ApiError(400, "Thumbnail file is required in Cloudinary")
    }
    video.title = title
    video.description = description
    video.thumbnail = uploadedThumbnail.url
    await video.save({validateBeforeSave: false})
    res.status(200).json(new ApiResponse(200, video, "Video updated successfully"))    
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID")
    }
    const video = await Video.findById(videoId)
    if (!video) {   
        throw new ApiError(404, "Video not found")
    }
    await deleteFromCloudinary(video.videofile)
    await deleteFromCloudinary(video.thumbnail)
    await video.deleteOne();
    return res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video not found")
    }
    video.isPublished = !video.isPublished
    await video.save({validateBeforeSave: false})
    const statusText = video.isPublished ? "Published" : "Unpublished";

    return res.status(200).json(new ApiResponse(200, video, `Video is now ${statusText}`))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}