import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponses.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"



const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = "desc", userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // ------------------ Build Match Stage ------------------
    const matchStage = {
        isPublished: true,
    };

    if (userId) {
        matchStage.owner = userId;
    }

    if (query) {
        matchStage.$or = [
            { 
                title: { 
                    $regex: query, 
                    $options: "i" 
                } 
            },
            { 
                description: { 
                    $regex: query, 
                    $options: "i" 
                } 
            },
        ];
    }

    // ------------------ Build Sort Stage ------------------
    const sortOrder = sortType === "asc" ? 1 : -1;
    const sortStage = {
        [sortBy]: sortOrder,
    };


    // ------------------ Run Aggregation ------------------
    const videos = await Video.aggregate([
        { $match: matchStage },
        { $sort: sortStage },
        { $skip: skip },
        { $limit: limitNum },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
            },
        },
        {
        $unwind: "$owner",
        },
        {
            $project: {
                title: 1,
                description: 1,
                videoFile: 1,
                thumbnail: 1,
                views: 1,
                createdAt: 1,
                duration: 1,
                isPublished: 1,
                owner: {
                    _id: 1,
                    username: 1,
                    avatar: 1,
                },
            },
        },
    ]);
    // ------------------ Count Total ------------------
    const total = await Video.countDocuments(matchStage);

    // ------------------ Send Response ------------------
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                total,
                page: pageNum,
                limit: limitNum,
                results: videos,
            },
            "Videos fetched successfully"
        )
    );
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if([title, description].some((field) => field.trim() === "")){
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
    const user = req.user
    
    const video = await Video.create({
        videofile : videoPath.url,
        thumbnail: thumbnailPath.url, 
        title,
        description, 
        duration: videoPath.duration,
        owner: user
    })
    const createdVideo = await Video.findById(video._id).select(
        "-thumbnail "
    )
    if(!createdVideo){
        throw new ApiError(500, "Error in creating video")
    }
    return res
        .status(201)
        .json(new ApiResponse(201, createdVideo, "Video published Successfully"))

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }
    video.views += 1
    await video.save()
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
    const user = await User.findById(req.user?._id)
    if(!user){
        throw new ApiError(404, "User not found")
    }
    if(user._id.toString() !== video.owner.toString()){
        throw new ApiError(403, "You are not allowed to update this video")
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
    await video.save()
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
    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorised to delete this video")
    }
    await deleteFromCloudinary(video.videofile)
    await deleteFromCloudinary(video.thumbnail)
    const deletedVideo = await video.deleteOne();
    return res.status(200).json(new ApiResponse(200, deletedVideo, "Video deleted successfully"))
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
    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorised to delete this video")
    }
    video.isPublished = !video.isPublished
    const toggledVideo = await video.save()
    const statusText = video.isPublished ? "Published" : "Unpublished";

    return res.status(200).json(new ApiResponse(200, toggledVideo, `Video is now ${statusText}`))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}