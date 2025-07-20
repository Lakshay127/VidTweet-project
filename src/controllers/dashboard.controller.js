import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponses.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from "../models/user.model.js"
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    
    
    // const channelId = req.user._id
    // const channel = await User.findById(channelId)
    // if (!channel) { 
    //     throw new ApiError(404, "Channel not found")
    // }
    // const totalVideos = await Video.countDocuments({ owner: channelId })
    // const totalViews = await Video.aggregate([
    //     { $match: { owner: channelId } },
    //     { $group: { _id: null, totalViews: { $sum: "$views" } } }
    // ])
    // const totalSubscribers = await Subscription.countDocuments({ channel: channelId })
    // const totalLikes = await Like.countDocuments({ channel: channelId })
    // res.status(200).json(new ApiResponse({
    //     totalVideos,
    //     totalViews: totalViews[0]?.totalViews || 0,
    //     totalSubscribers,
    //     totalLikes
    // }))

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const channelId = req.user._id;

    const stats = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videos"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "likes",
                let: { userId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ["$likedBy", "$$userId"]
                            }
                        }
                    }
                ],
                as: "likes"
            }
        },
        {
            $addFields: {
                totalVideos: { $size: "$videos" },
                totalViews: {
                    $sum: "$videos.views"
                },
                totalSubscribers: { $size: "$subscribers" },
                totalLikes: { $size: "$likes" }
            }
        },
        {
            $project: {
                totalVideos: 1,
                totalViews: 1,
                totalSubscribers: 1,
                totalLikes: 1
            }
        }
    ]);

    if (!stats?.length) {
        throw new ApiError(404, "Channel not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, stats[0], "Channel stats fetched successfully"));

})
const getChannelVideos = asyncHandler(async (req, res) => {
    const channelId = req.user._id;

    const videos = await Video.find({ owner: channelId })
        .select("title description views createdAt thumbnail url") // select only needed fields
        .sort({ createdAt: -1 }); // latest videos first

    return res.status(200).json(
        new ApiResponse(200, { videos }, "Channel videos fetched successfully")
    );
});


export {
    getChannelStats, 
    getChannelVideos
    }