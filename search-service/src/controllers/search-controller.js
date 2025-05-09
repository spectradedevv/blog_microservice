const Search = require('../model/Search')
const logger = require('../utils/logger')
const searchPostController = async(req,res)=>{
    logger.info(`Search endpoint hit`)
    try {
        const {query} = req.query
         const results = await Search.findOne({
            $text :{$search:query}
        },{
            score:{$meta:'textScore'}
        }).sort({score:{$meta:'textScore'}}).limit(10)
        const cacheKey = `search${query}`
        const cachedSearch = await req.redisClient.get(cacheKey)
        if(cachedSearch){
            res.json(JSON.parse(cachedSearch))
        }
        await req.redisClient.setex(cacheKey,300,JSON.stringify(results))
        res.json(results)  

    } catch (error) {
        
        logger.error('Error creating post',error)
        res.status(500).json({
            success:false,
            message:'Error while searching posts'
    })}
}

module.exports = {searchPostController}