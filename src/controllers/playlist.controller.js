import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponses.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    if([name, description].some((field) => (field.trim() || "") === "")){
        throw new ApiError(400, "All fields are required")
    }
    const user = await User.findById(req.user._id) 
    if(!user){
        throw new ApiError(404, "User not found")
    }
    const playlist = await Playlist.create({
        name, 
        description, 
        owner : req.user._id, 
        video: []
    })
    if(!playlist){
        throw new ApiError(500, "Error in creating playlist")
    }
    return res.status(201).json(new ApiResponse(201, playlist, "Playlist created succcessfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user ID")
    }
    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoList",
            }
        }
    ]);
    if(playlists.length === 0){
        return res.status(200).json(new ApiResponse(200, [], "No playlist created by this user"))
    }
    return res.status(200).json(new ApiResponse(200, playlists, "Playlists created by user fetched"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist ID")
    }
    const playList = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId),
            },  
        },  
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoList",
            },
        },
  ]);

  if (playList.length === 0) {
    throw new ApiError(404, "Playlist not found");
  }

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist ID")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID")
    }
    const user = await User.findById(req.user._id) 
    if(!user){
        throw new ApiError(404, "User not found")
    }
    
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }
    if(playlist.owner.toString() !== user._id.toString()){
        throw new ApiError(403, "You are not authorised to access this playlist")
    }
    // Prevent duplicates
    if (playlist.video.includes(videoId)) {
        throw new ApiError(400, "Video already in playlist");
    }
    playlist.video.push(videoId)
    await playlist.save()
    return res.status(200).json(new ApiResponse(200, playlist, "Video added to playlist successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist ID")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID")
    }
    const user = await User.findById(req.user._id) 
    if(!user){
        throw new ApiError(404, "User not found")
    }
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }
    if(playlist.owner.toString() !== user._id.toString()){
        throw new ApiError(403, "You are not authorised to access this playlist")
    }
    if (!playlist.video.includes(videoId)) {
        throw new ApiError(400, "Video not in playlist");
    }
    playList.videos = playList.videos.filter(
        (item) => item.toString() !== videoId
    );
    await playlist.save();
    const resultPlaylist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        }
    ])
    return res.status(200).json(new ApiResponse(200, resultPlaylist[0], "Video deleted from playlist successfully"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist ID")
    }
    const user = await User.findById(req.user._id) 
    if(!user){
        throw new ApiError(404, "User not found")
    }
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }
    if(playlist.owner.toString() !== user._id.toString()){
        throw new ApiError(403, "You are not authorised to access this playlist")
    }
    const deletedPlaylist = await Playlist.deleteOne({_id: new mongoose.Types.ObjectId(playlistId) })
    return res.status(200).json(new ApiResponse(200, deletedPlaylist, "Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if([name, description].some((field) => field.trim() === "")){
        throw new ApiError(400, "All fields are required")
    }
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist ID")
    }
    const user = await User.findById(req.user._id) 
    if(!user){
        throw new ApiError(404, "User not found")
    }
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }
    if(playlist.owner.toString() !== user._id.toString()){
        throw new ApiError(403, "You are not authorised to access this playlist")
    }
    if (playlist.name === name && playlist.description === description) {
        return res.status(200).json(new ApiResponse(200, playlist, "No changes detected"));
    }
    playlist.name = name
    playlist.description = description
    await playlist.save()

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}