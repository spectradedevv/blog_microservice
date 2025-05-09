const logger = require('../utils/logger')
const {validateRegistration, validateLogin} = require('../utils/validation')
const User = require('../models/User')
const generateTokens = require('../utils/generateToken')
const RefreshToken = require('../models/refreshToken')

const registerUser = async(req,res)=>{
    logger.info('Registration endpoint hit ....')

    try {
        //validate the schema

        const {error} = validateRegistration(req.body)
        if(error){
            logger.warn('Validation error',error.details[0].message)
            
            return res.status(400).json({
                success:false,
                message:error.details[0].message
            })

        }

        const {email,password,username, phoneNumber,country,referrals} = req.body

        let user = await User.findOne({$or:[{email},{username}]})

        if(user){
            logger.warn('User already exists')
            
            return res.status(400).json({
                success:false,
                message:'User already exists'
            })
        }

        user = new User({username,email,password,phoneNumber,country,referrals})

        await user.save()

        logger.warn('User saved successfully',user._id)

        const {accessToken,refreshToken} = await generateTokens(user)
 
        res.status(201).json({
            success:true,
            message:'User registered',
            accessToken,
            refreshToken

        })

    } catch (error) {
        logger.error('Registration error occured',error)
        res.status(500).json({
            success:false,
            message:'Internal server error'
        })
    }
}

const loginUser = async(req,res)=>{
  
   logger.info(`Login endpoint hit....`)
   try {
    const {error} = validateLogin(req.body)
    
    if(error){
        logger.warn('Validation error',error.details[0].message)
        
        return res.status(400).json({
            success:false,
            message:error.details[0].message
        })

    }

    const {email,password} = req.body
    const user = await User.findOne({email})
    if(!user){
        logger.warn("Invalid user")
        return res.status(400).json({
            success:false,
            message:'Invalid credentials'
        })
    }

    const isValidPassword = await user.comparePassword(password)
    if(!isValidPassword){
        logger.warn("Invalid user")
        return res.status(400).json({
            success:false,
            message:'Invalid password'
        })
    } 

    const {accessToken,refreshToken} = await generateTokens(user)

    res.json({
        accessToken,
        refreshToken,
        userId:user._id,
        email:email
    })

   } catch (error) {
    logger.error('Registration error occured',error)
    res.status(500).json({
        success:false,
        message:'Internal server error'
    })
   }

}

const refreshTokenUser = async(req,res)=>{
    logger.info('Refresh token endpoint hit...')
    try {
        const {refreshToken} = req.body
        if(!refreshToken){
            logger.warn('Refresh token missing')
               
        return res.status(400).json({
            success:false,
            message:error.details[0].message
        })
    }
    
    const storedToken = await RefreshToken.findOne({token:refreshToken})

    if(!storedToken||storedToken.expiresAt<new Date()){
        logger.warn('Invalid or expired refresh token')
        return res.status(401).json({
            success:false,
            message:'Invalid or expired token'
        })
    }

    const user = await User.findById(storedToken.user)
    if(!user){
        logger.warn('User nof found')
        logger.warn('Invalid or expired refresh token')
        return res.status(401).json({
            success:false,
            message:'User not found'
        })
    }

    const {accessToken:newAccessToken,refreshToken:newRefreshToken} = await generateTokens(user)

    //delete the old refresh token
    await RefreshToken.deleteOne({_id:storedToken._id})

    res.json({
        accessToken:newAccessToken,
        refreshToken:newRefreshToken
    })
    } catch (error) {
        logger.error('Token error occured',error)
        res.status(500).json({
            success:false,
            message:'Internal server error'
        })
    }
}

const logoutUser = async(req,res)=>{
    logger.info('Logout enpoint hit ....')
    try {

        const {refreshToken} = req.body
        if(!refreshToken){
            logger.warn('Refresh token missing')
               
        return res.status(400).json({
            success:false,
            message:error.details[0].message
        })
    }
        await RefreshToken.deleteOne({token:refreshToken})
        logger.info('Refreh token deleted for logout')

        res.json({
            success:true,
            message:'Logged out successfully'
        })
        
    } catch (error) {
        logger.error('error while logging out',error)
        res.status(500).json({
            success:false,
            message:'Internal server error'
        })
    }
}

module.exports = {registerUser,loginUser,refreshTokenUser,logoutUser}