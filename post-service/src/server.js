require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const Redis = require('ioredis')
const {rateLimit} = require('express-rate-limit')
const cors = require('cors')
const helmet = require('helmet')
const postRoutes = require('./routes/post-routes')
const errorHandler = require('./middlewares/errorHandler')
const logger = require('./utils/logger')
const {RedisStore} = require('rate-limit-redis')
const { connectRabbitMQ } = require('./utils/rabbitmq')
const app = express()
const PORT = 3002
mongoose.connect(process.env.CONNECTION_STRING).then(()=>logger.info('Connected to mongodb')).catch((error)=>logger.error("Mongo connection error",error))

const redisClient = new Redis(process.env.REDIS_URL)

app.use(helmet())
app.use(cors())
app.use(express.json())

app.use((req,res,next)=>{
    logger.info(`Received ${req.method} request to ${req.url}`)
    logger.info(`Request body ${req.body}`)
    next()
})

const sensitiveEndpointsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max:50,
    standardHeaders:true,
    legacyHeaders:false,
    handler:(req,res)=>{
        logger.warn(`Sensitive endpoint rate limit exceeded for IP:${req.ip}`)
        res.status(429).json({success:false,message:"Too many requests"})
    },
    store: new RedisStore({
        sendCommand:(...args) => redisClient.call(...args)
    })
   
})

app.use('/api/posts',sensitiveEndpointsLimiter)

app.use('/api/posts',(req,res,next)=>{
    req.redisClient = redisClient
    next()
},postRoutes)

app.use(errorHandler)

async function startServer(){
    try {
        await connectRabbitMQ()
        app.listen(PORT,()=>{
            logger.info(`Post service runnig on PORT ${PORT}`)
        })
    } catch (error) {
        logger.error('Failed to connect to server',error)
        process.exit(1)
    }
}

startServer()

//unhandled promise rejection

process.on('unhandledRejection',(reason,promise)=>{
    logger.error('Unhandled rejection at',promise,"reason",reason)
})