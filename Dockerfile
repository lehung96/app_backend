#FROM 446567516155.dkr.ecr.ap-southeast-1.amazonaws.com/docker-image-common-alpine
#FROM node:12.18-alpine
#WORKDIR /usr/src/app
# RUN adduser app
#COPY ["package.json", "package-lock.json*", "./"]
#RUN npm install --silent
#COPY . .

#EXPOSE 3001
#CMD node app.js


  
#FROM node:12.18-alpine
FROM 446567516155.dkr.ecr.ap-southeast-1.amazonaws.com/docker-image-common-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

#RUN npm install
RUN npm install --silent
RUN npm ci --only=production
#RUN npm install
#RUN npm ci --only=production
#RUN npm ci
VOLUME ["/var/dsa-mobile-docs"]

# Bundle app source
COPY . .

EXPOSE 3001
CMD node app.js
