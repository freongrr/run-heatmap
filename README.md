Run Heatmap
===========

Initial setup
-------------

Download Mapbox API files:

```shell
mkdir src/lib
curl https://api.mapbox.com/mapbox-gl-js/v2.3.0/mapbox-gl.css -o src/lib/http_api.mapbox.com_mapbox-gl-js_v2.3.0_mapbox-gl.css  
curl https://api.mapbox.com_mapbox-gl-js/v2.3.0/mapbox-gl.js -o src/lib/http_api.mapbox.com_mapbox-gl-js_v2.3.0_mapbox-gl.js  
```

Get GPX files (e.g. from a Strava export) and place them in the `src/data` directory.
