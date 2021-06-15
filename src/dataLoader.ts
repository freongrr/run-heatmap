// Copied from https://webpack.js.org/guides/dependency-management/

// TODO : try with inlined resources instead of URLs
const traceUrls = new Map<string, string>();

function importAll(r: any) {
    r.keys().forEach((key: any) => {
        const fileName = key.replace('./', '');
        const url = r(key);
        traceUrls.set(fileName, url);
    });
}

// @ts-ignore
importAll(require.context('./data/', false, /\.gpx$/));

export { traceUrls };
