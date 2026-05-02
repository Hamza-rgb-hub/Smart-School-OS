FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN mkdir -p uploads/logos uploads/profiles uploads/misc
EXPOSE 5000
CMD ["node", "index.js"]
