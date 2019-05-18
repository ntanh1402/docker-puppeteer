FROM node:lts-slim

RUN apt-get update && \
apt-get install -yq gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 \
libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 \
libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst ttf-freefont \
ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget --no-install-recommends && \
apt-get install -yq xvfb && \
apt-get clean && apt-get autoremove -y && rm -rf /var/lib/apt/lists/* && rm -rf /src/*.deb

# It's a good idea to use dumb-init to help prevent zombie chrome processes.
ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.0/dumb-init_1.2.0_amd64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init

# Create app directory
WORKDIR /root

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package.json app.js ./

#RUN npm install
# If you are building your code for production
RUN npm install --only=production

EXPOSE 8000

ENTRYPOINT ["dumb-init", "--"]
CMD [ "xvfb-run", "-a", "-e", "/dev/stdout", "npm", "start" ]
