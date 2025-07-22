// import {ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponses.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message
    const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";

    res.status(200).json(new ApiResponse(
        200,
        {
            uptime: process.uptime(), // server uptime in seconds
            db: dbStatus,
            timestamp: new Date().toISOString(),
        },
        "ok!"
    ))
})

export {
    healthcheck
    }
    