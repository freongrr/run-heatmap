// Copied from https://webpack.js.org/guides/dependency-management/

// TODO : try with inlined resources instead of URLs
const traceUrls: string[] = [];

function importAll(r: any) {
    r.keys().forEach((key: any) => {
        traceUrls.push(r(key));
    });
}

// @ts-ignore
importAll(require.context('./data/', false, /\.gpx$/));

export { traceUrls };
