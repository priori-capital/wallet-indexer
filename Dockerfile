FROM node:16


WORKDIR /indexer
ADD . /indexer
RUN yarn install
RUN yarn build

RUN ["chmod", "+x", "./start.sh"]
EXPOSE 3000

CMD ["/bin/bash","-c","./start.sh"]
