FROM node:16

EXPOSE 3000

WORKDIR /indexer
ADD . /indexer
RUN yarn install
RUN yarn build
CMD yarn start