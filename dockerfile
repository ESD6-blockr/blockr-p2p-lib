FROM node:alpine as BUILD
WORKDIR /opt
COPY ["package.json", "package-lock.json", "tslint.json", "tsconfig.json", "./" ]
RUN npm i
COPY ["src",  "./src" ]
RUN npm run build

FROM node:alpine as FINAL
WORKDIR /dist
COPY --from=BUILD /opt/dist .
WORKDIR /
COPY --from=BUILD /opt/package.json ./
COPY --from=BUILD /opt/package-lock.json ./
RUN npm i
ENTRYPOINT [ "node", "dist/main.js" ]