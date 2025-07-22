import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponses.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Comment} from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "video not found!");
    }
    const userId = req.user?._id
    const videoLike = await Like.findOne({video: videoId, likedBy: userId})
    if (videoLike) {
        // If like exists, removing it
        await Like.deleteOne({id: videoLike._id})
        return res.status(200).json(new ApiResponse(200, {}, "Video Like removed"))
    } 
    else {
        // If like does not exist, making a new like
        const likedVideo = await Like.create({
            video: videoId,
            comment: null,
            tweet: null,
            likedBy: userId
        })
        return res.status(200).json(new ApiResponse(200, likedVideo, "Video liked successfully"))
    }

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId, videoId} = req.params
    //TODO: toggle like on comment

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }
    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(404, "Comment not found")
    }
    const video = await Comment.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video not found")
    }
    const userId = req.user._id
    
    const commentLike = await Like.findOne({comment: commentId, likedBy: userId, video: videoId})
    if (commentLike) {
        // If like exists, remove it
        await Like.deleteOne({id: commentLike._id})
        return res.status(200).json(new ApiResponse(200, {}, "Comment like removed"))
    } 
    else {
        // If like does not exist, create it
        const newLike = await Like.create({
            likedComment: commentId, 
            tweet: null,
            video: videoId,
            likedBy: req.user._id
        })
        return res.status(201).json(new ApiResponse(200, likedComment, "Comment liked successfully"))
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet+
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid Tweet ID")
    }
    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404, "Tweet not found")
    }
    const user = req.user?._id
    const tweetLike = await Like.findOne({tweet: tweetId, likedBy:userId})
    if(tweetLike){
        await Like.deleteOne({id: tweetLike._id})
        return res.status(200).json(new ApiResponse(200, {}, "Tweet Like removed"))
    }
    else{
        const likedTweet = await Like.create({
            tweet: tweetId,
            comment: null,
            video: null,
            likedBy: req.user._id
        })
        return res.status(201).json(new ApiResponse(200, likedTweet, "Tweet liked successfully"))
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedvideos = await Like.aggregate([
        {
            $match: {
                comment: null,
                tweet: null,
                likedBy: userId,
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedvideoDetails",
            },
        },
        {
            $unwind: "$likedvideoDetails",
        },
        {
            $project: {
                title: "$likedvideoDetails.title",
                description: "$likedvideoDetails.description",
                videoFile: "$likedvideoDetails.videoFile",
                duration: "$likedvideoDetails.duration",
                thumbnail: "$likedvideoDetails.thumbnail",
                owner: "$likedvideoDetails.owner",
            },
        },
    ]);
    
    return res
        .status(200)
        .json(new ApiResponse(200, likedVideos, "Liked videos retrieved successfully"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}