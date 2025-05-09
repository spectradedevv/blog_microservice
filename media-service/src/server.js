require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const mediaRoutes = require('./routes/media-routes')
const errorHandler = require('./middleware/errorHandler')
const logger = require('./utils/logger')
const { consumeEvent,connectRabbitMQ } = require('./utils/rabbitmq')
const { handlePostDeleted } = require('./eventHandlers/media-event-handlers')

const app = express()
const PORT = process.env.PORT||3003

mongoose.connect(process.env.CONNECTION_STRING).then(()=>logger.info('Connected to mongodb')).catch((error)=>logger.error("Mongo connection error",error))

app.use(cors())
app.use(helmet())
app.use(express.json())



app.use('/api/media',mediaRoutes)

app.use((req,res,error,next)=>{
    logger.info(`Received ${req.method} request to ${req.url}`)
    logger.info(`Request body ${req.body}`)
    next()
})
app.use(errorHandler)



async function startServer(){
    try {
        await connectRabbitMQ()
        
        //consume all the events
        await consumeEvent('post:deleted',handlePostDeleted)

        app.listen(PORT,()=>{
            logger.info(`Media service running on PORT ${PORT}`)
        })
    } catch (error) {
        logger.error('Failed to connect to server',error)
        process.exit(1)
    }
}

startServer()

process.on('unhandledRejection',(reason,promise)=>{
    logger.error('Unhandled rejection at',promise,"reason",reason)
})