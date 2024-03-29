Run Heatmap
===========

My personalized heat-map.

Usage
-----

Copy `src/client/config/index.ts` to `src/client/config/index.custom.ts` and enter a mapbox token.

Start the app with:

    npm run client:build
    npm run server:build
    npm run server:start

Open app at http://localhost:3000/

Drag and drop GPX files (e.g. from a Strava export)

Development
-----------

During development, the backend can stay up while the front-end part refreshes: 

    # in terminal 1
    npm run server:build
    npm run server:start

    # in terminal 2 
    npm run client:dev

In this case, the front-end is accessed via http://localhost:8080/ (opens automatically)

TODO : use Babel or a Typescript wrapper instead of compiling. It makes it difficult to debug,
       and it restricts a lot what can be used (absolute import, "advanced" features)

Semi-static deployment
----------------------

There is a mode where static files can be served by a HTTP server and the API by the NodeJS app:

    npm run client:build
    npm run server:build
    npm run pack-www

Then copy the content of `www` somewhere

Finish setup:

    npm install

    # Upgrade DB if needed
    npm run db:upgrade

Start, using HTTP and/or HTTPS:

    npm run start-www

    SSL_KEY_PATH=xxx SSL_CERT_PATH=yyy npm run start-www
