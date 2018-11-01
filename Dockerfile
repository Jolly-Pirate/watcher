FROM keymetrics/pm2:latest-alpine

WORKDIR /watcher

COPY package*.json ./

RUN npm install

RUN npm install -g typescript pm2

COPY . /watcher

RUN tsc

CMD [ "pm2-runtime", "dist/index.js" ]