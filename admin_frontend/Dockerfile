FROM node:18-alpine
WORKDIR /admin_frontend/
COPY public/ /admin_frontend/public
COPY src/ /admin_frontend/src
COPY package.json /admin_frontend/
COPY postcss.config.js /admin_frontend/
COPY tailwind.config.js /admin_frontend/
COPY demo.env /frontend/.env
RUN npm install
CMD ["npm", "start"]
