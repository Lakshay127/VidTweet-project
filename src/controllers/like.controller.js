import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponses.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    const videoLike = await Like.findOne({video: videoId, likedBy: req.user._id})
    if (videoLike) {
        // If like exists, removing it
        await Like.deleteOne({video: videoId, likedBy: req.user._id})
        return res.status(200).json(new ApiResponse(200, {}, "Video Like removed"))
    } 
    else {
        // If like does not exist, making a new like
        const newLike = new Like({
            video: videoId,
            likedBy: req.user._id
        })
        await newLike.save()
        return res.status(201).json(new ApiResponse(200, {}, "Video liked successfully"))
    }

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }
    const commentLike = await Like.findOne({comment: commentId, likedBy: req.user._id})
    if (commentLike) {
        // If like exists, remove it
        await Like.deleteOne({comment: commentId, likedBy: req.user._id})
        return res.status(200).json(new ApiResponse(200, {}, "Comment like removed"))
    } 
    else {
        // If like does not exist, create it
        const newLike = new Like({
            comment: commentId, 
            likedBy: req.user._id
        })
        await newLike.save()
        return res.status(201).json(new ApiResponse(200, {}, "Comment liked successfully"))
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet+
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid Tweet ID")
    }
    const tweetLike = await Like.findOne({tweet: tweetId, likedBy:req.user._id})
    if(tweetLike){
        await Like.deleteOne({tweet: tweetId, likedBy:req.user._id})
        return res.status(200).json(new ApiResponse(200, {}, "Tweet Like removed"))
    }
    else{
        const newLike = new Like({
            tweet: tweetId,
            likedBy: req.user._id
        })
        await newLike.save()    
        return res.status(201).json(new ApiResponse(200, {}, "Tweet liked successfully"))
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedVideos = await Like.find({likedBy: req.user._id, video: { $exists: true, $ne: null }}).populate("video")
    if (!likedVideos || likedVideos.length === 0) {
        return res.status(401).json(new ApiResponse(404, {}, "No liked videos found"))
    }
    return res.status(200).json(new ApiResponse(200, likedVideos, "Liked videos retrieved successfully"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}