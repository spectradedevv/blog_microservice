#use the official node.js 18 image with alpine linux as base image
FROM node:18-alpine

WORKDIR /src/app/app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 3002

CMD ["node","src/server.js"]