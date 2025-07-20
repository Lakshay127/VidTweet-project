import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponses.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    if([name, description].some((field) => (field.trim() || "") === "")){
        throw new ApiError(400, "All fields are required")
    }
    if(!req.body || !req.body._id){
        throw new ApiError(400, "Invalid User")
    }
    const owner = req.user._id
    const playlist = await Playlist.create({
        name, 
        description, 
        owner
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
    const playlists = await Playlist.find({owner: userId})
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
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not found")
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
    
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId, 
        {
            $addToSet: {
                video: videoId
            }
        }, 
        {
            new: true
        }
    )
    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }
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
    
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                video: videoId
            }
        },
        {
            new: true
        }
    )
    if(!playlist){
        throw new ApiError(400, "Invalid Playlist")
    }
    return res.status(200).json(new ApiResponse(200, playlist, "Video deleted from playlist successfully"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist ID")
    }
    const playlist = await Playlist.findByIdAndDelete(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }
    return res.status(200).json(new ApiResponse(200, {}, "Playlist deleted successfully"))
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
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not found")
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