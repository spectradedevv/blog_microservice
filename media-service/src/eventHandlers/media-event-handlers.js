const Media = require("../model/Media")
const { deleteMediaFromCloudinary } = require("../utils/cloudinary")

const handlePostDeleted =  async(event)=>{
    const {postId,mediaIds} = event 
    try {
        const mediaToDelete = await Media.find({_id:{$in:mediaIds}})

        for (const media of mediaToDelete){
            await deleteMediaFromCloudinary(media.publicId)
            await Media.findByIdAndDelete(media._id)

            logger.info(`Deleted media ${media._id} associated with this deleted post ${postId}`)
        }
    } catch (error) { 
        logger.error(e,'Error occured while media deletion')
    }
}

module.exports = {handlePostDeleted}