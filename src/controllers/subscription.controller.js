import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponses.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid Channel ID")
    }
    const channel = await User.findById(channelId)
    if(!channel){
        throw new ApiError(404, "Channel not found")
    }
    const userId = req.user?._id
    if (userId.toString() === channelId) {
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }

    const subscription = await Subscription.findOne({subscriber: userId, channel: channelId})
    if(subscription){
        await Subscription.deleteOne({subscriber: userId, channel: channelId})
        return res.status(200).json(new ApiResponse(200, {}, "Unsubscribed Channel successfully"))
    }
    else{
        const newSubscription = new Subscription({
            subscriber: userId, 
            channel: channelId
        })
        await newSubscription.save()
        const totalSubscribers = await Subscription.countDocuments({ channel: channelId });
        return res.status(201).json(new ApiResponse(201, {subscription: newSubscription, totalSubscribers}, "Subscribed Channel successfully"))
    }
    
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {subscriberId} = req.params
    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "Invalid Channel ID")
    }
    const channel = await User.findById(subscriberId)
    if(!channel){
        throw new ApiError(404, "Channel not found")
    }
    const subscribers = await Subscription
        .find({channel: subscriberId})
        .populate("subscriber", "username email")  
    return res.status(200).json(new ApiResponse(200, {subscribers}, "Channel Subscribers fetched successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid subscriber ID")
    }
    const subscribedChannels = await Subscription.find({subscriber: channelId}).populate("channel", "username email")
    return res.status(200).json(new ApiResponse(200, {subscribedChannels}, "Subscribed Channels fetched successfully"))
    
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}