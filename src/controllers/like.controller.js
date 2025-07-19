import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
// import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    const videoLike = await Like.findOne({video: videoId, user: req.user._id})
    if (videoLike) {
        // If like exists, remove it
        await Like.deleteOne({video: videoId, user: req.user._id})
        return res.status(200).json({message: "Video like removed"})
    } 
    else {
        // If like does not exist, create it
        const newLike = new Like({
            video: videoId,
            user: req.user._id
        })
        await newLike.save()
        return res.status(201).json({message: "Video liked successfully"})
    }

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }
    const commentLike = await Comment.findOne({comment: commentId, video: videoId, user: req.user._id})
    if (commentLike) {
        // If like exists, remove it
        await Like.deleteOne({comment: commentId, video: videoId, user: req.user._id})
        return res.status(200).json({message: "Comment like removed"})
    } 
    else {
        // If like does not exist, create it
        const newLike = new Like({
            comment: commentId,
            video: videoId,
            user: req.user._id
        })
        await newLike.save()
        return res.status(201).json({message: "Comment liked successfully"})
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}