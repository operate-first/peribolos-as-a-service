FROM node:12-slim
WORKDIR /usr/src/app
COPY . .
RUN npm install -g typescript
RUN npm ci --production
RUN npm cache clean --force
ENV NODE_ENV="production"
RUN npm run build
CMD [ "npm", "start" ]
