import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponses.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video not found")
    }
    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
            },
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "owner",
                as: "ownerDetails",
            },
        },
        {
            $unwind: "$ownerDetails",
        },
        {
            $project: {
                _id: 1,
                content: 1,
                ownerName: "$ownerDetails.userName",
                avatar: "$ownerDetails.avatar",
            },
        },
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, comments, "All comments fetched successfully"));

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {content} = req.body
    if (!videoId) {
        throw new ApiError(400, "Video ID is missing");
    }
  
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video not found")
    }
    if(!content || content.trim() === ""){
        throw new ApiError(400, "Content is required")
    }
    if(!req.user || !req.user._id){
        throw new ApiError(404, "User not found")
    }
    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    })
    if(!comment){
        throw new ApiError(500, "Error in creating comment")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment added successfully"))
    
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {content} = req.body
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment ID")
    }
    if(!content || content.trim() === ""){
        throw new ApiError(400, "Content is required")
    }   
    
    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(404, "Comment not found")
    }
    const user = await User.findById(req.user._id)
    if(!user){
        throw new ApiError(404, "User not found")
    }
    if(user._id.toString() !== comment.owner.toString()){
        throw new ApiError(403, "We are not authorized to update the comment")
    }
    comment.content = content.trim()
    const updatedComment = await comment.save()
    return res
        .status(200)
        .json(new ApiResponse(200, updatedComment, "Comment updated successfully"))

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment ID")
    }
    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(404, "Comment not found")
    }
    const user = await User.findById(req.user._id)
    if(!user){
        throw new ApiError(404, "User not found")
    }
    if(user._id.toString() !== comment.owner.toString()){
        throw new ApiError(401, "You are not allowed to delete this comment")
    }
    await Comment.deleteOne({_id: new mongoose.Types.ObjectId(commentId)});
    return res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }