FROM node:18-alpine
WORKDIR /frontend/
COPY public/ /frontend/public
COPY src/ /frontend/src
COPY package.json /frontend/
COPY config-overrides.js /frontend/
COPY postcss.config.js /frontend/
COPY tailwind.config.js /frontend/
COPY demo.env /frontend/.env
RUN npm install
CMD ["npm", "start"]
