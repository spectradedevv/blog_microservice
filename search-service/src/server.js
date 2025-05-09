require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const Redis = require('ioredis')
const {rateLimit} = require('express-rate-limit')
const cors = require('cors')
const helmet = require('helmet')
const errorHandler = require('./middlewares/errorHandler')
const logger = require('./utils/logger')
const { connectRabbitMQ,consumeEvent} = require('./utils/rabbitmq')
const searchRoutes = require('./routes/search-route')
const { handlePostCreated, handlePostDeleted } = require('./eventHandlers/search-event-handler')
 
const app = express()
const PORT = process.env.PORT ||3004
const redisClient = new Redis(process.env.REDIS_URL)

app.use(helmet())
app.use(cors())
app.use(express.json())


mongoose.connect(process.env.CONNECTION_STRING).then(()=>logger.info('Connected to mongodb')).catch((error)=>logger.error("Mongo connection error",error))

app.use((req,res,next)=>{
    logger.info(`Received ${req.method} request to ${req.url}`)
    logger.info(`Request body ${req.body}`)
    next()
}) 

app.use('/api/search',(req,res,next)=>{
     req.redisClient = redisClient
     next()
},searchRoutes)

app.use(errorHandler)

async function startServer(){
    try {
        await connectRabbitMQ()
        //  consume the events / suscribe to the event
        await consumeEvent('post:created',handlePostCreated)
        await consumeEvent('deleted',handlePostDeleted)
        app.listen(PORT,()=>{
            logger.info(`Search service is running on ${PORT}`)
        })
    } catch (error) {
       logger.error(error,'Failed to start search service') 
       process.exit(1)
    }
}

startServer()