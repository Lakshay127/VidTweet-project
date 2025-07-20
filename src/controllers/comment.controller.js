import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

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
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: {createdAt: -1}
    }
    const comments = await Comment.paginate({video: videoId}, options)
    if(!comments || comments.docs.length === 0){
        throw new ApiError(404, "No comments found for this video")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, comments, "Comments retrieved successfully"))

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {content} = req.body
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
        video,
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
    const comment = await Comment.findByIdAndUpdate(commentId, {content}, {new: true})
    if(!comment){
        throw new ApiError(404, "Comment not found")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment updated successfully"))

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
    await comment.deleteOne();
    return res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }