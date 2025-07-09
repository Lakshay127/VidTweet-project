import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponses.js"






const registerUser = asyncHandler(async (req, res) => {
    /*
    --------------------STEPS TO FOLLOW FOR MAKING BUSINESS LOGIC HERE---------------------------------------

    1. get user details from frontend
    2. validation - not empty
    3. check if user already exists: username, email
    4. check for images
    5. check for avatar
    6. upload them to cloudinary, check for avatar on cloudinary
    7. create user object - create entry in db
    8. remove passwored and refresh token field from response
    9. check for user creation
    10. return res


    */

    // STEP - 1
    const {fullName, email, username, password} = req.body
    // console.log("Email: ", email)

    // STEP - 2
    
    /*
    if(fullName === ""){
        throw new ApiError(400, "Full name is required")
    }        ----->      Similarly check for all other fields or use below code
    */
    
    if(
        [fullName, email, username, password].some((field) =>
            field?.trim() === "" )
    ){
        throw new ApiError("400", "All fields are required")
    }  //       ------>     Checks all field in same loop, if value returns out to be true for any of one field -> ApiError is thrown 

    // STEP - 3
    const existedUser = User.findOne({
        $or : [{ username }, { email }]
    })
    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    // STEP - 4 and 5
    const avatarLocalPath = req.files?.avatar[0]?.path;
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover Image file is required")
    }

    // STEP - 6
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // STEP - 7
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })

    // STEP - 8
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    // STEP - 9
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }
    // STEP - 10
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

})

export {registerUser}