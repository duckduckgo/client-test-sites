/* exported testAPIs */
/* globals FIRST_PARTY_HOSTNAME */

const timeout = 1000; // ms; used for cross-tab communication APIs

function getURL (path, fileType, key) {
    const url = new URL(`/partitioning/${path}`, window.location.origin);
    url.searchParams.set('fileType', fileType);
    url.searchParams.set('key', key);
    return url;
}

const sleepMs = (timeMs) => new Promise(
    (resolve, reject) => setTimeout(resolve, timeMs)
);

const loadSubresource = async (tagName, url) => {
    const element = document.createElement(tagName);
    document.body.appendChild(element);
    const resultPromise = new Promise((resolve, reject) => {
        element.addEventListener('load', resolve, { once: true });
        element.addEventListener('error', reject, { once: true });
    });
    element.src = url;
    try {
        return await resultPromise;
    } catch (e) {
        // some sort of loading error happened
        return e;
    }
};

// Validates storage APIs which return the value of the token stored in
// the storage container within each test context. E.g.,
//
// document.cookie
//     same-site: [ { "value": "51c69e1b" }, { "value": "51c69e1b" } ]
//    cross-site: [ { "value": "fd10f7f5d2cf" }, { "value": "fd10f7f5d2cf" } ]
function validateStorageAPI (sameSites, crossSites, random) {
    if (
        (sameSites.every(v => v.error === 'Unsupported')) &&
        (crossSites.every(v => v.error === 'Unsupported'))
    ) {
        return 'unsupported';
    }

    if (sameSites[0].value !== random) {
        if (sameSites[0].value === null && typeof sameSites[0].error !== 'undefined') {
            return 'error';
        }
        return 'fail';
    }

    if (
        (sameSites.length === 0) ||
        (crossSites.length !== sameSites.length) ||
        (!sameSites.every(v => v.value === sameSites[0].value)) ||
        (!crossSites.every(v => v.value === crossSites[0].value)) ||
        (!crossSites.every(v => v.value !== sameSites[0].value))
    ) {
        return 'fail';
    }
    return 'pass';
}

// Validates the results returned by Cache APIs. These return a count of the
// number of requests the server has received upon each pageload. E.g.,
//
// Iframe Cache
//     same-site: [ { "value": "1" }, { "value": "1" } ]
//    cross-site: [ { "value": "2" }, { "value": "2" } ]
function validateCacheAPI (sameSites, crossSites) {
    if (
        (sameSites.every(v => v.error === 'No requests received')) &&
        (crossSites.every(v => v.error === 'No requests received'))
    ) {
        return 'unsupported';
    } else if (
        (sameSites.length > 0) &&
        (crossSites.length === sameSites.length) &&
        (sameSites.every(v => v.value === sameSites[0].value)) &&
        (crossSites.every(v => v.value === crossSites[0].value)) &&
        (crossSites.every(v => v.value === sameSites[0].value + 1))
    ) {
        return 'pass';
    } else if (
        (sameSites.every(v => v.value === sameSites[0].value)) &&
        (crossSites.every(v => v.value === crossSites[0].value)) &&
        (crossSites.every(v => v.value === sameSites[0].value))
    ) {
        return 'fail';
    }
    return 'error';
}

const testAPIs = {
    'document.cookie': {
        type: 'storage',
        store: (data) => {
            // we are using same set of tests for main frame and an iframe
            // we want to set 'Lax' in the main frame for the cookie not to be suspicious
            // we want to set 'None' in an iframe for cookie to be accessible to us
            const sameSite = (window !== window.top) ? 'None' : 'Lax';

            document.cookie = `partition_test=${data}; expires= Wed, 21 Aug 2030 20:00:00 UTC; Secure; SameSite=${sameSite}`;
        },
        retrieve: () => {
            return document.cookie.match(/partition_test=([0-9a-z-]+)/)[1];
        },
        validate: validateStorageAPI
    },
    localStorage: {
        type: 'storage',
        store: (data) => {
            localStorage.setItem('partition_test', data);
        },
        retrieve: () => {
            return localStorage.getItem('partition_test');
        },
        validate: validateStorageAPI
    },
    sessionStorage: {
        type: 'storage',
        store: (data) => {
            sessionStorage.setItem('partition_test', data);
        },
        retrieve: () => {
            return sessionStorage.getItem('partition_test');
        },
        validate: validateStorageAPI
    },
    IndexedDB: {
        type: 'storage',
        store: (data) => {
            return DB('partition_test').then(db => Promise.all([db.deleteAll(), db.put({ id: data })])).then(() => 'OK');
        },
        retrieve: () => {
            return DB('partition_test').then(db => db.getAll()).then(data => data[0].id);
        },
        validate: validateStorageAPI
    },
    WebSQL: {
        type: 'storage',
        store: (data) => {
            let res, rej;
            const promise = new Promise((resolve, reject) => { res = resolve; rej = reject; });

            const db = window.openDatabase('partition_test', '1.0', 'partition_test', 2 * 1024 * 1024);

            db.transaction(tx => {
                tx.executeSql('CREATE TABLE IF NOT EXISTS partition_test (value)', [], () => {
                    tx.executeSql('DELETE FROM partition_test;', [], () => {
                        tx.executeSql('INSERT INTO partition_test (value) VALUES (?)', [data], () => res(), (sql, e) => rej('err - insert ' + e.message));
                    }, (sql, e) => rej('err - delete ' + e.message));
                }, (sql, e) => rej('err - create ' + e.message));
            });

            return promise;
        },
        retrieve: () => {
            if (!window.openDatabase) {
                throw new Error('Unsupported');
            }
            let res, rej;
            const promise = new Promise((resolve, reject) => { res = resolve; rej = reject; });

            const db = window.openDatabase('partition_test', '1.0', 'data', 2 * 1024 * 1024);

            db.transaction(tx => {
                tx.executeSql('SELECT * FROM partition_test', [], (tx, d) => {
                    res(d.rows[0].value);
                }, (sql, e) => rej('err - select ' + e.message));
            });

            return promise;
        },
        validate: (sameSites, crossSites) => {
            if (
                (sameSites.every(v => v.error === 'Unsupported')) &&
                (crossSites.every(v => v.error === 'Unsupported'))
            ) {
                return 'unsupported';
            } else if (
                (sameSites.every(v => v.error && v.error.endsWith('is deprecated'))) &&
                (crossSites.every(v => v.error && v.error.endsWith('is deprecated')))
            ) {
                return 'unsupported';
            }

            if (
                // (!sameSites.length === configurations['same-site'].iterations) ||
                // (!crossSites.length === configurations['cross-site'].iterations) ||
                (!sameSites.every(v => v.value === sameSites[0].value)) ||
                (!crossSites.every(v => v.value === crossSites[0].value)) ||
                (!crossSites.every(v => v.value !== sameSites[0].value))
            ) {
                return 'fail';
            }
            return 'pass';
        }
    },
    'Cache API': {
        type: 'storage',
        store: (data) => {
            return caches.open('partition_test').then((cache) => {
                const res = new Response(data, {
                    status: 200
                });

                return cache.put('/cache-api-response', res);
            });
        },
        retrieve: () => {
            return caches.open('partition_test').then((cache) => {
                return cache.match('/cache-api-response')
                    .then(r => r.text());
            });
        },
        validate: validateStorageAPI
    },
    // Tests below here are inspired by: https://github.com/arthuredelstein/privacytests.org/
    ServiceWorker: {
        type: 'storage',
        store: async (data) => {
            if (!navigator.serviceWorker) {
                throw new Error('Unsupported');
            }
            await navigator.serviceWorker.register('serviceworker.js');

            // Wait until the new service worker is controlling the current context
            await new Promise(resolve => {
                if (navigator.serviceWorker.controller) return resolve();
                navigator.serviceWorker.addEventListener('controllerchange', () => resolve());
            });

            await fetch(`serviceworker-write?data=${data}`);
        },
        retrieve: async () => {
            if (!navigator.serviceWorker) {
                throw new Error('Unsupported');
            }
            if (!navigator.serviceWorker.controller) {
                throw new Error('No service worker controller for this context.');
            }
            const response = await fetch('serviceworker-read');
            return await response.text();
        },
        validate: validateStorageAPI
    },
    BroadcastChannel: {
        type: 'communication',
        store: (data) => {
            const bc = new BroadcastChannel('partition_test');
            bc.onmessage = (event) => {
                if (event.data === 'request') {
                    bc.postMessage(data);
                }
            };
        },
        retrieve: () => {
            return new Promise((resolve, reject) => {
                if (!window.BroadcastChannel) {
                    reject(new Error('Unsupported'));
                }
                const bc = new BroadcastChannel('partition_test');
                bc.onmessage = (event) => {
                    if (event.data !== 'request') {
                        resolve(event.data);
                    }
                };
                bc.postMessage('request');
                setTimeout(() => {
                    console.log('reject - bc');
                    reject(new Error(`No BroadcastChannel message received within timeout ${timeout}`));
                }, timeout);
            });
        },
        validate: validateStorageAPI
    },
    SharedWorker: {
        type: 'communication',
        store: (data) => {
            try {
                const worker = new SharedWorker('helpers/sharedworker.js');
                worker.port.start();
                worker.port.postMessage(data);
            } catch (e) {
                throw new Error('Unsupported');
            }
        },
        retrieve: () => {
            return new Promise((resolve, reject) => {
                if (!window.SharedWorker) {
                    reject(new Error('Unsupported'));
                }
                const worker = new SharedWorker('helpers/sharedworker.js');
                worker.port.start();
                worker.port.onmessage = (e) => {
                    if (typeof e.data === 'undefined') {
                        resolve(null);
                    }
                    resolve(e.data);
                };
                worker.port.postMessage('request');
                setTimeout(() => {
                    console.log('reject - shared worker');
                    reject(new Error(`No Shared Worker message received within timeout ${timeout}`));
                }, timeout);
            });
        },
        validate: validateStorageAPI
    },
    'Web Locks API': {
        type: 'communication',
        store: async (key) => {
            if (!navigator.locks) {
                throw new Error('Unsupported');
            }
            navigator.locks.request(key, () => new Promise(() => {}));
            const queryResult = await navigator.locks.query();
            return queryResult.held[0].clientId;
        },
        retrieve: async () => {
            if (!navigator.locks) {
                throw new Error('Unsupported');
            }
            const queryResult = await navigator.locks.query();
            return queryResult.held[0].name;
        },
        validate: validateStorageAPI
    },
    'Fetch Cache': {
        type: 'cache',
        store: async (data) => {
            await fetch(getURL('resource', 'fetch', data),
                { cache: 'force-cache' }
            );
        },
        retrieve: async (data) => {
            await fetch(getURL('resource', 'fetch', data),
                { cache: 'force-cache' }
            );
            const countResponse = await fetch(getURL('ctr', 'fetch', data),
                { cache: 'reload' }
            );
            return parseInt((await countResponse.text()).trim());
        },
        validate: validateCacheAPI
    },
    'XMLHttpRequest Cache': {
        type: 'cache',
        store: (key) => new Promise((resolve, reject) => {
            const req = new XMLHttpRequest();
            req.addEventListener('load', resolve, { once: true });
            req.open('GET', getURL('resource', 'xhr', key));
            req.setRequestHeader('Cache-Control', 'max-age=604800');
            req.send();
        }),
        retrieve: async (key) => {
            const req = new XMLHttpRequest();
            const xhrLoadPromise = new Promise((resolve, reject) => {
                req.addEventListener('load', resolve, { once: true });
            });
            req.open('GET', getURL('resource', 'xhr', key));
            req.setRequestHeader('Cache-Control', 'max-age=604800');
            req.send();
            await xhrLoadPromise;
            const countResponse = await fetch(
                getURL('ctr', 'xhr', key), { cache: 'reload' });
            return parseInt((await countResponse.text()).trim());
        },
        validate: validateCacheAPI
    },
    'Iframe Cache': {
        type: 'cache',
        store: (key) => new Promise((resolve, reject) => {
            const iframe = document.createElement('iframe');
            document.body.appendChild(iframe);
            iframe.addEventListener('load', () => resolve(key), { once: true });
            iframe.src = getURL('resource', 'page', key);
        }),
        retrieve: async (key) => {
            const iframe = document.createElement('iframe');
            document.body.appendChild(iframe);
            const iframeLoadPromise = new Promise((resolve, reject) => {
                iframe.addEventListener('load', resolve, { once: true });
            });
            const address = getURL('resource', 'page', key);
            iframe.src = address;
            await iframeLoadPromise;
            const countResponse = await fetch(
                getURL('ctr', 'page', key), { cache: 'reload' });
            return parseInt((await countResponse.text()).trim());
        },
        validate: validateCacheAPI
    },
    'Image Cache': {
        type: 'cache',
        store: (key) => new Promise((resolve, reject) => {
            const img = document.createElement('img');
            document.body.appendChild(img);
            img.addEventListener('load', resolve, { once: true });
            img.src = getURL('resource', 'image', key);
        }),
        retrieve: async (key) => {
            const img = document.createElement('img');
            document.body.appendChild(img);
            const imgLoadPromise = new Promise((resolve, reject) => {
                img.addEventListener('load', resolve, { once: true });
            });
            img.src = getURL('resource', 'image', key);
            await imgLoadPromise;
            const countResponse = await fetch(
                getURL('ctr', 'image', key), { cache: 'reload' });
            return parseInt((await countResponse.text()).trim());
        },
        validate: validateCacheAPI
    },
    'Favicon Cache': {
        type: 'cache',
        store: () => {}, // noop since the favicon is set in the top-level frame
        retrieve: async (key) => {
            // Wait for the favicon to load.
            // Unfortunately onload doesn't seem to fire for <link> elements, so
            // there isn't a way to do this synchronously.
            await sleepMs(500);
            const response = await fetch(
                getURL('ctr', 'favicon', key), { cache: 'reload' });
            const count = parseInt((await response.text()).trim());
            if (count === 0) {
                throw new Error('No requests received');
            }
            return count;
        },
        validate: validateCacheAPI
    },
    'Font Cache': {
        type: 'cache',
        store: async (key) => {
            const style = document.createElement('style');
            style.type = 'text/css';
            const fontURI = getURL('resource', 'font', key);
            style.innerHTML = `@font-face {font-family: "myFont"; src: url("${fontURI}"); } body { font-family: "myFont" }`;
            document.getElementsByTagName('head')[0].appendChild(style);
        },
        retrieve: async (key) => {
            const style = document.createElement('style');
            style.type = 'text/css';
            const fontURI = getURL('resource', 'font', key);
            style.innerHTML = `@font-face {font-family: "myFont"; src: url("${fontURI}"); } body { font-family: "myFont" }`;
            document.getElementsByTagName('head')[0].appendChild(style);
            await sleepMs(500);
            const response = await fetch(
                getURL('ctr', 'font', key), { cache: 'reload' });
            return parseInt((await response.text()).trim());
        },
        validate: validateCacheAPI
    },
    'CSS cache': {
        type: 'cache',
        store: async (key) => {
            const href = getURL('resource', 'css', key);
            const head = document.getElementsByTagName('head')[0];
            head.innerHTML += `<link type="text/css" rel="stylesheet" href="${href}">`;
        },
        retrieve: async (key) => {
            const href = getURL('resource', 'css', key);
            const head = document.getElementsByTagName('head')[0];
            head.innerHTML += `<link type="text/css" rel="stylesheet" href="${href}">`;
            const testElement = document.querySelector('#css');
            let fontFamily;
            while (true) {
                await sleepMs(100);
                fontFamily = getComputedStyle(testElement).fontFamily;
                if (fontFamily.startsWith('fake')) {
                    break;
                }
            }
            return fontFamily;
        },
        validate: (sameSites, crossSites) => {
            //  same-site: [ { "value": "fake_652798686603804" }, { "value": "fake_652798686603804" } ]
            // cross-site: [ { "value": "fake_35491713503664246" }, { "value": "fake_35491713503664246" } ]
            if (
                (sameSites.every(v => v.value.startsWith('fake_'))) &&
                (crossSites.every(v => v.value.startsWith('fake_'))) &&
                (sameSites.every(v => v.value === sameSites[0].value)) &&
                (crossSites.every(v => v.value === crossSites[0].value)) &&
                (crossSites.every(v => v.value !== sameSites[0].value))
            ) {
                return 'pass';
            } else if (
                (sameSites.every(v => v.value.startsWith('fake_'))) &&
                (crossSites.every(v => v.value.startsWith('fake_'))) &&
                (sameSites.every(v => v.value === sameSites[0].value)) &&
                (crossSites.every(v => v.value === crossSites[0].value)) &&
                (crossSites.every(v => v.value === sameSites[0].value))
            ) {
                return 'fail';
            }
            return 'error';
        }
    },
    'Prefetch Cache': {
        type: 'cache',
        store: async (key) => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = getURL('resource', 'prefetch', key);
            document.getElementsByTagName('head')[0].appendChild(link);
        },
        retrieve: async (key) => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = getURL('resource', 'prefetch', key).href;
            document.getElementsByTagName('head')[0].appendChild(link);
            await sleepMs(500);
            const response = await fetch(
                getURL('ctr', 'prefetch', key), { cache: 'reload' });
            const count = parseInt((await response.text()).trim());
            if (count === 0) {
                throw new Error('No requests received');
            }
            return count;
        },
        validate: validateCacheAPI
    },
    HSTS: {
        type: 'hsts',
        store: async () => {
            // Clear any current HSTS
            const clearURL = new URL('/partitioning/clear_hsts.png', `https://hsts.${FIRST_PARTY_HOSTNAME}/`);
            await loadSubresource('img', clearURL.href);

            // Set HSTS
            const setURL = new URL('/partitioning/set_hsts.png', `https://hsts.${FIRST_PARTY_HOSTNAME}/`);
            await loadSubresource('img', setURL.href);
        },
        retrieve: async () => {
            // Attempt to retrieve an image over HTTP
            // The retrieval will fail if not upgraded to HTTPS by the browser.
            const getURL = new URL('/partitioning/get_hsts.png', `http://hsts.${FIRST_PARTY_HOSTNAME}/`);
            const event = await loadSubresource('img', getURL.href);
            if (event.type === 'load') {
                return 'https';
            } else if (event.type === 'error') {
                return 'http';
            }
        },
        validate: (sameSites, crossSites) => {
            //  same-site: [ { "value": "https" }, { "value": "https" } ]
            // cross-site: [ { "value": "http" }, { "value": "http" } ]
            if ( // browser allows subresources to set HSTS, but partitions cross-site
                (sameSites.every(v => v.value === 'https')) &&
                (crossSites.every(v => v.value === 'http'))
            ) {
                return 'pass';
            } else if ( // browser doesn't allow subresources to set HSTS (be careful with false positives)
                (sameSites.every(v => v.value === 'http')) &&
                (crossSites.every(v => v.value === 'http'))
            ) {
                return 'pass';
            } else if (
                (sameSites.every(v => v.value === 'https')) &&
                (crossSites.every(v => v.value === 'https'))
            ) {
                return 'fail';
            }
            return 'error';
        }
    }
};
