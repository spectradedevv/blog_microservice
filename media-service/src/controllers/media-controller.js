const { uploadMediaTocloudinary } = require("../utils/cloudinary")
const logger = require("../utils/logger")
const Media = require("../model/Media")

const uploadaMedia = async(req,res)=>{
    logger.info('Starting media upload')
    
    try {
        if(!req.file){
            logger.error('No file present,Please try adding a file and try')
            return res.status(400).json({
                success:false,
                message:'No file found, please add a file and try again'
            })
        }
        const {originalname, mimetype,buffer} = req.file
        const userId = req.user.userId
        logger.info(`File details: name=${originalname},type=${mimetype}`)
        logger.info('Uploading to cloudinary starting....')

        const cloudinaryUploadResult = await uploadMediaTocloudinary(req.file)
        logger.info(`Cloudinary upload successfully, Public Id: - ${cloudinaryUploadResult.public_id}`)

        const newlyCreatedMedia = new Media({
            publicId:cloudinaryUploadResult.public_id,
            originalName:originalname,
            mimeType: mimetype,
            url:cloudinaryUploadResult.secure_url,
            userId
 
        })
        await newlyCreatedMedia.save()
        res.status(201).json({
            success:true,
            mediaId:newlyCreatedMedia.url,

        })
    } catch (error) {
            logger.error('Error creating media',error)
        res.status(500).json({
            success:false, 
            message:'Error creating media'
        })
    }
}

module.exports = {uploadaMedia}