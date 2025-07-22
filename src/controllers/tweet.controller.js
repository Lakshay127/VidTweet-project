import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponses.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body
    if(!content || content.trim().length === 0){
        throw new ApiError(400, "Content is required")
    }
    
    const user = await User.findById(req.user?._id)
    if(!user){
        throw new ApiError(404, "User not found")
    }
    const tweet = await Tweet.create({
        content, 
        owner: req.user._id
    })
    if(!tweet){
        throw new ApiError(400, "Tweet cannot be created")
    }
    return res.status(200).json(new ApiResponse(200, tweet, "Tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid User ID")
    }
    const user = await User.findById(userId)
    if(!user){
        throw new ApiError(404, "User not found")
    }
    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
        },
    ])


    if(!tweets || tweets.length === 0){
        return res.status(200).json(new ApiResponse(200, [], "No tweets found for this user"))
    }
    return res.status(200).json(new ApiResponse(200, tweets, "Tweets retrieved successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid Tweet")
    }
    const {newContent} = req.body
    if(!newContent || newContent.trim().length === 0){
        throw new ApiError(400, "Content is required")
    }
    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404, "Tweet not found")
    }
    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId, 
        {
            $set: {
                content: newContent,
            }
        }, 
        {
            new: true
        }
    )
    
    return res.status(200).json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid Tweet")
    }
    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404, "Tweet not found")
    }
    await Tweet.deleteOne({id: tweet._id})
    return res.status(200).json(new ApiResponse(200, {}, "Tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}