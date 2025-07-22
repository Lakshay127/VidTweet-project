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
    const subscriber = await User.findById(req.user._id);
    if (!subscriber) {
        throw new ApiError(404, "user not found");
    }
    const channel = await User.findById(channelId)
    if(!channel){
        throw new ApiError(404, "Channel not found")
    }
    
    if (subscriber._id.toString() === channelId) {
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }

    const subscription = await Subscription.findOne({
        subscriber: subscriber._id, 
        channel: channel._id
    })
    if(subscription){
        await Subscription.deleteOne({
            subscriber: subscriber._id, 
            channel: channel._id
        })
        return res.status(200).json(new ApiResponse(200, {}, "Unsubscribed Channel successfully"))
    }
    else{
        const newSubscription = new Subscription({
            subscriber: subscriber._id, 
            channel: channel._id
        })
        await newSubscription.save()
        const totalSubscribers = await Subscription.countDocuments({ channel: channelId });
        return res.status(201).json(new ApiResponse(201, {subscription: newSubscription, totalSubscribers}, "Subscribed Channel successfully"))
    }
    
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid Channel ID")
    }
    const channel = await User.findById(channelId)
    if(!channel){
        throw new ApiError(404, "Channel not found")
    }
    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails"
            }
        },
        {
            $unwind: "$subscriberDetails"
        }, 
        {
            $project: {
                _id: 0,
                subscriberName: "$subscriberDetails.username",
                avatar: "$subscriberDetails.avatar",
                coverImage: "$subscriberDetails.coverImage"
            }
        }
    ]);
    if(subscribers.length === 0){
        return res.status(200).json(new ApiResponse(200, {}, "No subscribers found"))
    }
    return res.status(200).json(new ApiResponse(200, subscribers, "Channel Subscribers fetched successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "Invalid subscriber ID")
    }
    const currentSubscriber = await User.findById(subscriberId)
    if(!currentSubscriber){
        throw new ApiError(404, "User not found")
    }
    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "user",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannels"
            }
        },
        {
            $unwind: "$subscribedChannels"
        },
        {
            $project: {
                _id: 0,
                channelName: "$subscribedChannels.username",
                avatar: "$subscribedChannels.avatar",
                coverImage: "$subscribedChannels.coverImage"
            }
        }
    ])
    if(subscribedChannels.length === 0){
        return res.status(200).json(new ApiResponse(200, {}, "No subscribed Channels found"))
    }
    return res.status(200).json(new ApiResponse(200, {subscribedChannels}, "Subscribed Channels fetched successfully"))
    
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}