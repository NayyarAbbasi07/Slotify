FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PROCESS_ROLE=api

EXPOSE 3008

CMD ["node", "./bin/www"]
