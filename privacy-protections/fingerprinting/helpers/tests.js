/* eslint-disable promise/param-names, no-return-assign */
/* globals AmbientLightSensor, Gyroscope, Magnetometer, chrome, webkitOfflineAudioContext, applyFpExampleDataToCanvas */
async function sha256 (str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder('utf-8').encode(str));
    return Array.prototype.map.call(new Uint8Array(buf), x => (('00' + x.toString(16)).slice(-2))).join('');
}

function addCanvasToPage (canvas, reason) {
    const canvasCheck = document.getElementById('canvas-check');
    canvasCheck.removeAttribute('hidden');
    const containerElement = document.createElement('div');
    const headerElement = document.createElement('h2');
    headerElement.textContent = reason;
    containerElement.appendChild(headerElement);
    containerElement.appendChild(canvas);
    canvasCheck.appendChild(containerElement);
}

const tests = [
    // headers
    {
        id: 'headers - accept',
        category: 'headers',
        getValue: () => headers.then(res => res.headers.accept)
    },
    {
        id: 'headers - accept-encoding',
        category: 'headers',
        getValue: () => headers.then(res => res.headers['accept-encoding'])
    },
    {
        id: 'headers - accept-language',
        category: 'headers',
        getValue: () => headers.then(res => res.headers['accept-language'])
    },
    {
        id: 'headers - dnt',
        category: 'headers',
        getValue: () => headers.then(res => res.headers.dnt)
    },
    {
        id: 'headers - user-agent',
        category: 'headers',
        getValue: () => headers.then(res => res.headers['user-agent'])
    },

    // navigator
    {
        id: 'navigator.userAgent',
        category: 'navigator',
        getValue: () => navigator.userAgent
    },
    {
        id: 'navigator.deviceMemory',
        category: 'navigator',
        getValue: () => navigator.deviceMemory
    },
    {
        id: 'navigator.hardwareConcurrency',
        category: 'navigator',
        getValue: () => navigator.hardwareConcurrency
    },
    {
        id: 'navigator.product',
        category: 'navigator',
        getValue: () => navigator.product
    },
    {
        id: 'navigator.productSub',
        category: 'navigator',
        getValue: () => navigator.productSub
    },
    {
        id: 'navigator.appName',
        category: 'navigator',
        getValue: () => navigator.appName
    },
    {
        id: 'navigator.appVersion',
        category: 'navigator',
        getValue: () => navigator.appVersion
    },
    {
        id: 'navigator.appCodeName',
        category: 'navigator',
        getValue: () => navigator.appCodeName
    },
    {
        id: 'navigator.language',
        category: 'navigator',
        getValue: () => navigator.language
    },
    {
        id: 'navigator.languages',
        category: 'navigator',
        getValue: () => navigator.languages
    },
    {
        id: 'navigator.platform',
        category: 'navigator',
        getValue: () => navigator.platform
    },
    {
        id: 'navigator.vendor',
        category: 'navigator',
        getValue: () => navigator.vendor
    },
    {
        id: 'navigator.vendorSub',
        category: 'navigator',
        getValue: () => navigator.vendorSub
    },
    {
        id: 'navigator.mimeTypes',
        category: 'navigator',
        getValue: () => {
            const results = {};

            Array.from(navigator.mimeTypes).forEach(mtype => results[mtype.type] = true);

            return results;
        }
    },
    {
        id: 'navigator.cookieEnabled',
        category: 'navigator',
        getValue: () => navigator.cookieEnabled
    },
    {
        id: 'navigator.doNotTrack',
        category: 'navigator',
        getValue: () => navigator.doNotTrack
    },
    {
        id: 'navigator.maxTouchPoints',
        category: 'navigator',
        getValue: () => navigator.maxTouchPoints
    },
    {
        id: 'navigator.connection',
        category: 'navigator',
        getValue: () => ({
            effectiveType: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink,
            rtt: navigator.connection.rtt,
            saveData: navigator.connection.saveData
        })
    },
    {
        id: 'navigator.storage.estimate()',
        category: 'navigator',
        getValue: () => navigator.storage.estimate()
    },
    {
        id: 'navigator.plugins',
        category: 'navigator',
        getValue: () => Array.from(navigator.plugins).map(p => ({
            name: p.name,
            filename: p.filename,
            description: p.description
        }))
    },
    {
        id: 'navigator.javaEnabled()',
        category: 'navigator',
        getValue: () => navigator.javaEnabled()
    },
    {
        id: 'navigator.getBattery()',
        category: 'navigator',
        getValue: () => navigator.getBattery().then(b => ({
            charging: b.charging,
            chargingTime: b.chargingTime,
            level: b.level
        }))
    },
    {
        id: 'navigator.getGamepads()',
        category: 'navigator',
        getValue: () => {
            return Array.from(navigator.getGamepads()).map(gamepad => {
                if (!gamepad) {
                    return null;
                }

                return {
                    id: gamepad.id,
                    buttons: gamepad.buttons.length,
                    axes: gamepad.axes.length
                };
            });
        }
    },
    {
        id: 'navigator.permissions.query()',
        category: 'navigator',
        getValue: () => {
            function getPermissionIfKnown (pName) {
                return navigator.permissions.query({ name: pName })
                    .then(r => ({ name: pName, state: r.state }))
                    .catch(e => ({ name: pName, state: 'failure' }));
            }

            return Promise.all([
                getPermissionIfKnown('camera'),
                getPermissionIfKnown('clipboard'),
                getPermissionIfKnown('device-info'),
                getPermissionIfKnown('geolocation'),
                getPermissionIfKnown('gyroscope'),
                getPermissionIfKnown('magnetometer'),
                getPermissionIfKnown('microphone'),
                getPermissionIfKnown('midi'),
                getPermissionIfKnown('notifications'),
                getPermissionIfKnown('persistent-storage'),
                getPermissionIfKnown('push'),
                getPermissionIfKnown('speaker')
            ]).then(results => {
                const resultsObj = {};

                results.forEach(r => resultsObj[r.name] = r.state);

                return resultsObj;
            });
        }
    },
    {
        id: 'navigator.bluetooth.getAvailability()',
        category: 'navigator',
        getValue: () => navigator.bluetooth.getAvailability()
    },
    {
        id: 'navigator.buildID',
        category: 'navigator',
        getValue: () => navigator.buildID
    },
    {
        id: 'navigator.webdriver',
        category: 'navigator',
        getValue: () => navigator.webdriver
    },
    {
        id: 'navigator.mediaDevices.enumerateDevices',
        category: 'navigator',
        getValue: () => {
            return navigator.mediaDevices.enumerateDevices()
                .then(devices => {
                    return devices.map(device => {
                        return {
                            deviceId: device.deviceId,
                            groupId: device.groupId,
                            kind: device.kind,
                            label: device.label
                        };
                    });
                });
        }
    },
    {
        id: 'navigator.webkitTemporaryStorage.queryUsageAndQuota',
        category: 'navigator',
        getValue: () => {
            let resolve;
            const promise = new Promise((res, rej) => { resolve = res; });

            navigator.webkitTemporaryStorage.queryUsageAndQuota((usage, quota) => resolve({ usage: usage, quota: quota }));

            return promise;
        }
    },
    {
        id: 'navigator.webkitPersistentStorage.queryUsageAndQuota',
        category: 'navigator',
        getValue: () => {
            let resolve;
            const promise = new Promise((res, rej) => { resolve = res; });

            navigator.webkitPersistentStorage.queryUsageAndQuota((usage, quota) => resolve({ usage: usage, quota: quota }));

            return promise;
        }
    },
    {
        id: 'navigator.userAgentData',
        category: 'navigator',
        getValue: () => ({
            brands: navigator.userAgentData.brands,
            mobile: navigator.userAgentData.mobile,
            platform: navigator.userAgentData.platform
        })
    },
    {
        id: 'navigator.userAgentData.getHighEntropyValues',
        category: 'navigator',
        getValue: () => {
            return navigator.userAgentData.getHighEntropyValues(['architecture', 'bitness', 'model', 'platformVersion', 'fullVersionList'])
                .then(obj => ({
                    architecture: obj.architecture,
                    bitness: obj.bitness,
                    model: obj.model,
                    platformVersion: obj.platformVersion,
                    fullVersionList: obj.fullVersionList
                }));
        }
    },

    // window
    {
        id: 'window.devicePixelRatio',
        category: 'window',
        getValue: () => window.devicePixelRatio
    },
    {
        id: 'window.localStorage',
        category: 'window',
        getValue: () => Boolean(window.localStorage)
    },
    {
        id: 'window.sessionStorage',
        category: 'window',
        getValue: () => Boolean(window.sessionStorage)
    },
    {
        id: 'window.indexedDB',
        category: 'window',
        getValue: () => Boolean(window.indexedDB)
    },
    {
        id: 'window.screenX',
        category: 'window',
        getValue: () => window.screenX
    },
    {
        id: 'window.screenLeft',
        category: 'window',
        getValue: () => window.screenLeft
    },
    {
        id: 'window.screenY',
        category: 'window',
        getValue: () => window.screenY
    },
    {
        id: 'window.screenTop',
        category: 'window',
        getValue: () => window.screenTop
    },
    {
        id: 'window.innerHeight',
        category: 'window',
        getValue: () => window.innerHeight
    },
    {
        id: 'window.outerHeight',
        category: 'window',
        getValue: () => window.outerHeight
    },
    {
        id: 'window.innerWidth',
        category: 'window',
        getValue: () => window.innerWidth
    },
    {
        id: 'window.outerWidth',
        category: 'window',
        getValue: () => window.outerWidth
    },
    {
        id: 'window.openDatabase("test", "1.0", "test", 1024)',
        category: 'window',
        getValue: () => Boolean(window.openDatabase('test', '1.0', 'test', 1024))
    },
    {
        id: 'window.locationbar.visible',
        category: 'window',
        getValue: () => window.locationbar.visible
    },
    {
        id: 'window.menubar.visible',
        category: 'window',
        getValue: () => window.menubar.visible
    },
    {
        id: 'window.personalbar.visible',
        category: 'window',
        getValue: () => window.personalbar.visible
    },
    {
        id: 'window.scrollbars.visible',
        category: 'window',
        getValue: () => window.scrollbars.visible
    },
    {
        id: 'window.statusbar.visible',
        category: 'window',
        getValue: () => window.statusbar.visible
    },
    {
        id: 'window.toolbar.visible',
        category: 'window',
        getValue: () => window.toolbar.visible
    },
    {
        id: 'window.offscreenBuffering',
        category: 'window',
        getValue: () => window.offscreenBuffering
    },

    // console
    {
        id: 'console.memory',
        category: 'console',
        getValue: () => ({
            jsHeapSizeLimit: console.memory.jsHeapSizeLimit,
            totalJSHeapSize: console.memory.totalJSHeapSize,
            usedJSHeapSize: console.memory.usedJSHeapSize
        })
    },

    // Performance
    {
        id: 'performance.memory',
        category: 'performance',
        getValue: () => ({
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            usedJSHeapSize: performance.memory.usedJSHeapSize
        })
    },

    // Screen
    {
        id: 'PerformanceNavigationTiming.nextHopProtocol',
        category: 'performance',
        getValue: () => performance.getEntries()[0].nextHopProtocol
    },
    {
        id: 'screen.width',
        category: 'screen',
        getValue: () => screen.width
    },
    {
        id: 'screen.height',
        category: 'screen',
        getValue: () => screen.height
    },
    {
        id: 'screen.availWidth',
        category: 'screen',
        getValue: () => screen.availWidth
    },
    {
        id: 'screen.availHeight',
        category: 'screen',
        getValue: () => screen.availHeight
    },
    {
        id: 'screen.colorDepth',
        category: 'screen',
        getValue: () => screen.colorDepth
    },
    {
        id: 'screen.pixelDepth',
        category: 'screen',
        getValue: () => screen.pixelDepth
    },
    {
        id: 'screen.availLeft',
        category: 'screen',
        getValue: () => screen.availLeft
    },
    {
        id: 'screen.availTop',
        category: 'screen',
        getValue: () => screen.availTop
    },
    {
        id: 'screen.orientation',
        category: 'screen',
        getValue: () => ({
            angle: screen.orientation.angle,
            type: screen.orientation.type
        })
    },

    // date
    {
        id: '(new Date()).getTimezoneOffset()',
        category: 'date',
        getValue: () => (new Date()).getTimezoneOffset()
    },
    {
        id: '(new Date()).toTimeString()',
        category: 'date',
        getValue: () => (new Date()).toTimeString().match('[0-9:]+ (.*)')[1]
    },

    {
        id: 'WebGLRenderingContext - static values',
        category: 'webgl',
        getValue: () => ({
            ALIASED_LINE_WIDTH_RANGE: WebGLRenderingContext.ALIASED_LINE_WIDTH_RANGE,
            ALPHA_BITS: WebGLRenderingContext.ALPHA_BITS,
            BLUE_BITS: WebGLRenderingContext.BLUE_BITS,
            DEPTH_BITS: WebGLRenderingContext.DEPTH_BITS,
            GREEN_BITS: WebGLRenderingContext.GREEN_BITS,
            RED_BITS: WebGLRenderingContext.RED_BITS,
            MAX_COMBINED_TEXTURE_IMAGE_UNITS: WebGLRenderingContext.MAX_COMBINED_TEXTURE_IMAGE_UNITS,
            MAX_CUBE_MAP_TEXTURE_SIZE: WebGLRenderingContext.MAX_CUBE_MAP_TEXTURE_SIZE,
            MAX_FRAGMENT_UNIFORM_VECTORS: WebGLRenderingContext.MAX_FRAGMENT_UNIFORM_VECTORS,
            MAX_RENDERBUFFER_SIZE: WebGLRenderingContext.MAX_RENDERBUFFER_SIZE,
            MAX_TEXTURE_IMAGE_UNITS: WebGLRenderingContext.MAX_TEXTURE_IMAGE_UNITS,
            MAX_TEXTURE_SIZE: WebGLRenderingContext.MAX_TEXTURE_SIZE,
            MAX_VARYING_VECTORS: WebGLRenderingContext.MAX_VARYING_VECTORS,
            MAX_VERTEX_ATTRIBS: WebGLRenderingContext.MAX_VERTEX_ATTRIBS,
            MAX_VERTEX_TEXTURE_IMAGE_UNITS: WebGLRenderingContext.MAX_VERTEX_TEXTURE_IMAGE_UNITS,
            MAX_VERTEX_UNIFORM_VECTORS: WebGLRenderingContext.MAX_VERTEX_UNIFORM_VECTORS,
            MAX_VIEWPORT_DIMS: WebGLRenderingContext.MAX_VIEWPORT_DIMS,
            RENDERER: WebGLRenderingContext.RENDERER,
            SHADING_LANGUAGE_VERSION: WebGLRenderingContext.SHADING_LANGUAGE_VERSION,
            VENDOR: WebGLRenderingContext.VENDOR,
            VERSION: WebGLRenderingContext.VERSION,
            VERTEX_SHADER: WebGLRenderingContext.VERTEX_SHADER,
            FRAGMENT_SHADER: WebGLRenderingContext.FRAGMENT_SHADER,
            COLOR_BUFFER_BIT: WebGLRenderingContext.COLOR_BUFFER_BIT,
            DEPTH_BUFFER_BIT: WebGLRenderingContext.DEPTH_BUFFER_BIT
        })
    },
    {
        id: 'WebGLRenderingContext.getSupportedExtensions()',
        category: 'webgl',
        getValue: () => {
            const c = document.createElement('canvas');
            const results = {};

            c.getContext('webgl').getSupportedExtensions().forEach(extension => results[extension] = true);

            return results;
        }
    },
    {
        id: 'WebGLRenderingContext.getContextAttributes()',
        category: 'webgl',
        getValue: () => {
            const c = document.createElement('canvas');
            return c.getContext('webgl').getContextAttributes();
        }
    },
    {
        id: 'WebGLRenderingContext.getShaderPrecisionFormat()',
        category: 'webgl',
        getValue: () => {
            const c = document.createElement('canvas');
            const result = c.getContext('webgl').getShaderPrecisionFormat(WebGLRenderingContext.FRAGMENT_SHADER, WebGLRenderingContext.LOW_FLOAT);

            return {
                precision: result.precision,
                rangeMin: result.rangeMin,
                rangeMax: result.rangeMax
            };
        }
    },
    {
        id: 'WebGLRenderingContext.getParameter()',
        category: 'webgl',
        getValue: () => {
            const elem = document.createElement('canvas');
            const context = elem.getContext('webgl');
            const result = {};

            webglConstantsList.forEach(name => {
                result[name] = context.getParameter(context[name]);
            });

            return result;
        }
    },

    // WebRTC
    {
        id: 'RTCIceCandidate.candidate',
        category: 'webrtc',
        getValue: () => {
            let resolve;
            const promise = new Promise((res, rej) => { resolve = res; });

            const c = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });

            c.onicecandidate = result => {
                console.log(result.candidate);
                if (result.candidate !== null) {
                    resolve(result.candidate.candidate);
                    c.close();
                }
            };
            c.createDataChannel('');

            c.createOffer().then(a => {
                c.setLocalDescription(a, () => {}, () => {});
            });

            return promise;
        }
    },

    // Intl
    {
        id: 'Intl.DateTimeFormat().resolvedOptions()',
        category: 'intl',
        getValue: () => Intl.DateTimeFormat().resolvedOptions()
    },

    // fonts
    {
        id: 'CanvasRenderingContext2D.measureText',
        category: 'fonts',
        getValue: () => {
            // inspiration: https://www.kirupa.com/html5/detect_whether_font_is_installed.htm

            // creating our in-memory Canvas element where the magic happens
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            // the text whose final pixel size I want to measure
            const text = 'abcdefghijklmnopqrstuvwxyz0123456789 !@#$%^&*()_-+=';

            // specifying the baseline font
            context.font = '72px monospace';

            // checking the size of the baseline text
            const baselineSize = context.measureText(text);

            const result = {};

            fontList.forEach(fontName => {
                // specifying the font whose existence we want to check
                context.font = "72px '" + fontName + "', monospace";

                // checking the size of the font we want to check
                const newSize = context.measureText(text);

                //
                // If the size of the two text instances is the same, the font does not exist because it is being rendered
                // using the default sans-serif font
                //
                if ((newSize.width !== baselineSize.width) || (newSize.height !== baselineSize.height)) {
                    result[fontName] = true;
                }
            });

            return result;
        }
    },
    {
        id: 'document.fonts.check',
        category: 'fonts',
        getValue: () => {
            const result = {};

            fontList.forEach(font => {
                if (document.fonts.check(`small "${font}"`)) {
                    result[font] = true;
                }
            });

            return result;
        }
    },

    // codecs
    {
        id: 'HTMLVideoElement.canPlayType()',
        category: 'codecs',
        getValue: () => {
            const video = document.createElement('video');
            const result = {};

            codecsList.forEach(codec => {
                result[codec] = video.canPlayType(codec);
            });

            return result;
        }
    },
    {
        id: 'MediaSource.isTypeSupported()',
        category: 'codecs',
        getValue: () => {
            const result = {};

            codecsList.forEach(codec => {
                result[codec] = MediaSource.isTypeSupported(codec);
            });

            return result;
        }
    },
    {
        id: 'navigator.mediaCapabilities.encodingInfo()',
        category: 'codecs',
        getValue: () => {
            const result = {};
            const promises = codecsList.map(codec => {
                const mediaConfig = {
                    type: 'file',
                    video: codec.startsWith('video')
                        ? {
                            contentType: codec,
                            width: 1920,
                            height: 1080,
                            bitrate: 120000,
                            framerate: 48
                        }
                        : undefined,
                    audio: codec.startsWith('audio')
                        ? {
                            contentType: codec,
                            channels: 2,
                            bitrate: 132700,
                            samplerate: 5200
                        }
                        : undefined
                };

                return navigator.mediaCapabilities.decodingInfo(mediaConfig).then(support => {
                    result[codec] = {
                        supported: support.supported,
                        smooth: support.smooth,
                        powerEfficient: support.powerEfficient
                    };
                }).catch(e => {
                    result[codec] = e.message;
                });
            });

            return Promise.all(promises).then(() => result);
        }
    },
    {
        id: 'navigator.requestMediaKeySystemAccess',
        category: 'codecs',
        getValue: () => {
            const config = {
                initDataTypes: ['cenc'],
                videoCapabilities: [{
                    contentType: 'video/mp4;codecs="avc1.4D401E"'
                }]
            };
            const keys = [
                'com.widevine.alpha',
                'com.microsoft.playready', 'com.youtube.playready',
                'webkit-org.w3.clearkey', 'org.w3.clearkey',
                'com.adobe.primetime', 'com.adobe.access',
                'com.apple.fairplay'
            ];

            return Promise.all(
                keys.map(key => navigator.requestMediaKeySystemAccess(key, [config]).catch(e => null))
            ).then(list => list.filter(i => i !== null).map(i => i.keySystem));
        }
    },

    // speechSyntesis
    {
        id: 'speechSynthesis.getVoices()',
        category: 'speechSynthesis',
        getValue: () => {
            let resolve;
            const promise = new Promise((res, rej) => { resolve = res; });

            // why timeout and calling the API twice? It's a workaround for a chromium bug of some sorts where first call to getVoices returns empty array
            speechSynthesis.getVoices();
            setTimeout(() => {
                const result = {};

                speechSynthesis.getVoices().forEach(voice => {
                    const item = {
                        name: voice.name,
                        lang: voice.lang
                    };

                    if (voice.default) {
                        item.default = true;
                    }

                    if (!voice.localService) {
                        item.external = true;
                    }

                    result[voice.voiceURI] = item;
                });

                resolve(result);
            }, 300);

            return promise;
        }
    },

    // Notification
    {
        id: 'Notification.permission',
        category: 'Notification',
        getValue: () => Notification.permission
    },

    // Sensors
    {
        id: 'AmbientLightSensor',
        category: 'sensors',
        getValue: () => {
            let resolve, reject;
            const promise = new Promise((res, rej) => { resolve = res; reject = rej; });

            const sensor = new AmbientLightSensor();
            sensor.onreading = () => {
                resolve({ illuminance: sensor.illuminance });
            };
            sensor.onerror = (event) => {
                reject(event.error.name + ': ' + event.error.message);
            };
            sensor.start();

            return promise;
        }
    },
    {
        id: 'Gyroscope',
        category: 'sensors',
        getValue: () => {
            let resolve, reject;
            const promise = new Promise((res, rej) => { resolve = res; reject = rej; });

            const sensor = new Gyroscope();
            sensor.onreading = () => {
                resolve({
                    x: sensor.x,
                    y: sensor.y,
                    z: sensor.z
                });
            };
            sensor.onerror = (event) => {
                reject(event.error.name + ': ' + event.error.message);
            };
            sensor.start();

            return promise;
        }
    },
    {
        id: 'Magnetometer',
        category: 'sensors',
        getValue: () => {
            let resolve, reject;
            const promise = new Promise((res, rej) => { resolve = res; reject = rej; });

            const sensor = new Magnetometer();
            sensor.onreading = () => {
                resolve({
                    x: sensor.x,
                    y: sensor.y,
                    z: sensor.z
                });
            };
            sensor.onerror = (event) => {
                reject(event.error.name + ': ' + event.error.message);
            };
            sensor.start();

            return promise;
        }
    },

    // chrome
    {
        id: 'chrome.loadTimes()',
        category: 'chrome',
        getValue: () => {
            const lt = chrome.loadTimes();

            return {
                connectionInfo: lt.connectionInfo,
                npnNegotiatedProtocol: lt.npnNegotiatedProtocol,
                wasAlternateProtocolAvailable: lt.wasAlternateProtocolAvailable,
                wasFetchedViaSpdy: lt.wasFetchedViaSpdy,
                wasNpnNegotiated: lt.wasNpnNegotiated
            };
        }
    },

    // css
    {
        id: 'any-hover: hover',
        category: 'css',
        getValue: () => window.matchMedia('(any-hover: hover)').matches
    },
    {
        id: 'any-pointer',
        category: 'css',
        getValue: () => ({
            fine: window.matchMedia('(any-pointer: fine)').matches,
            coarse: window.matchMedia('(any-pointer: coarse)').matches,
            none: window.matchMedia('(any-pointer: none)').matches
        })
    },
    {
        id: 'color',
        category: 'css',
        getValue: () => window.matchMedia('(color)').matches
    },
    {
        id: 'color-gamut',
        category: 'css',
        getValue: () => ({
            srgb: window.matchMedia('(color-gamut: srgb)').matches,
            p3: window.matchMedia('(color-gamut: p3)').matches,
            rec2020: window.matchMedia('(color-gamut: rec2020)').matches
        })
    },
    {
        id: 'color-index',
        category: 'css',
        getValue: () => window.matchMedia('(color-index)').matches
    },
    {
        id: 'display-mode',
        category: 'css',
        getValue: () => ({
            fullscreen: window.matchMedia('(display-mode: fullscreen)').matches,
            standalone: window.matchMedia('(display-mode: standalone)').matches,
            minimalui: window.matchMedia('(display-mode: minimal-ui)').matches,
            browser: window.matchMedia('(display-mode: browser)').matches
        })
    },
    {
        id: 'forced-colors: active',
        category: 'css',
        getValue: () => window.matchMedia('(forced-colors: active)').matches
    },
    {
        id: 'grid: 1',
        category: 'css',
        getValue: () => window.matchMedia('(grid: 1)').matches
    },
    {
        id: 'hover: hover',
        category: 'css',
        getValue: () => window.matchMedia('(hover: hover)').matches
    },
    {
        id: 'inverted-colors: inverted',
        category: 'css',
        getValue: () => window.matchMedia('(inverted-colors: inverted)').matches
    },
    {
        id: 'monochrome',
        category: 'css',
        getValue: () => window.matchMedia('(monochrome)').matches
    },
    {
        id: 'orientation: landscape',
        category: 'css',
        getValue: () => window.matchMedia('(orientation: landscape)').matches
    },
    {
        id: 'overflow-block',
        category: 'css',
        getValue: () => ({
            scroll: window.matchMedia('(overflow-block: scroll)').matches,
            optionalpaged: window.matchMedia('(overflow-block: optional-paged)').matches,
            paged: window.matchMedia('(overflow-block: paged)').matches,
            none: window.matchMedia('(overflow-block: none)').matches
        })
    },
    {
        id: 'overflow-inline: scroll',
        category: 'css',
        getValue: () => window.matchMedia('(overflow-inline: scroll)').matches
    },
    {
        id: 'pointer',
        category: 'css',
        getValue: () => ({
            fine: window.matchMedia('(pointer: fine)').matches,
            coarse: window.matchMedia('(pointer: coarse)').matches,
            none: window.matchMedia('(pointer: none)').matches
        })
    },
    {
        id: 'prefers-color-scheme',
        category: 'css',
        getValue: () => ({
            dark: window.matchMedia('(prefers-color-scheme: dark)').matches,
            light: window.matchMedia('(prefers-color-scheme: light)').matches
        })
    },
    {
        id: 'prefers-contrast',
        category: 'css',
        getValue: () => ({
            more: window.matchMedia('(prefers-contrast: more)').matches,
            less: window.matchMedia('(prefers-contrast: less)').matches,
            nopreference: window.matchMedia('(prefers-contrast: no-preference)').matches
        })
    },
    {
        id: 'prefers-reduced-motion: reduce',
        category: 'css',
        getValue: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
    },
    {
        id: 'prefers-reduced-transparency: reduce',
        category: 'css',
        getValue: () => window.matchMedia('(prefers-reduced-transparency: reduce)').matches
    },
    {
        id: 'scan: interlace',
        category: 'css',
        getValue: () => window.matchMedia('(scan: interlace)').matches
    },
    {
        id: 'scripting',
        category: 'css',
        getValue: () => ({
            none: window.matchMedia('(scripting: none)').matches,
            initialonly: window.matchMedia('(scripting: initial-only)').matches,
            enabled: window.matchMedia('(scripting: enabled)').matches
        })
    },
    {
        id: 'update',
        category: 'css',
        getValue: () => ({
            none: window.matchMedia('(update: none)').matches,
            slow: window.matchMedia('(update: slow)').matches,
            fast: window.matchMedia('(update: fast)').matches
        })
    },
    {
        id: 'system-colors',
        category: 'css',
        getValue: () => {
            const colors = ['ActiveCaption', 'AppWorkspace', 'Background', 'ButtonFace', 'ButtonHighlight', 'ButtonShadow', 'ButtonText', 'CaptionText', 'GrayText', 'Highlight', 'HighlightText', 'InactiveBorder', 'InactiveCaption', 'InactiveCaptionText', 'InfoBackground', 'InfoText', 'Menu', 'MenuText', 'Scrollbar', 'ThreeDDarkShadow', 'ThreeDFace', 'ThreeDHighlight', 'ThreeDLightShadow', 'ThreeDShadow', 'Window', 'WindowFrame', 'WindowText', 'ActiveBorder'];
            const results = {};
            const startButton = document.querySelector('#start');

            colors.forEach(color => {
                startButton.style.backgroundColor = color;
                results[color] = window.getComputedStyle(startButton).backgroundColor;
            });

            startButton.removeAttribute('style');

            return results;
        }
    },

    // audio FP
    {
        id: 'audio',
        category: 'full-fingerprints',
        getValue: async () => {
            // eslint-disable-next-line new-cap
            const context = window.OfflineAudioContext ? new OfflineAudioContext(1, 44100, 44100) : new webkitOfflineAudioContext(1, 44100, 44100);
            const renderedBuffer = await applyFpExampleDataToAudio(context);
            const fingerprint = renderedBuffer.getChannelData(0)
                .slice(4500, 5000)
                .reduce(function (acc, val) { return acc + Math.abs(val); }, 0)
                .toString();
            return fingerprint;
        }
    },
    {
        id: 'audio',
        category: 'full-fingerprint-expensive',
        getValue: async () => {
            // eslint-disable-next-line new-cap
            const context = window.OfflineAudioContext ? new OfflineAudioContext(1, 44100, 44100) : new webkitOfflineAudioContext(1, 44100, 44100);
            const renderedBuffer = await applyFpExampleDataToAudio(context);

            const vals = [];
            for (let i = 0; i < renderedBuffer.length; i++) {
                vals.push(renderedBuffer.getChannelData(0)[i].toString());
            }

            const fingerprint = vals
                .reduce(function (acc, val) { return acc + Math.abs(val); }, 0)
                .toString();
            return fingerprint;
        }
    },
    {
        id: 'audio-copyFromChannel',
        category: 'full-fingerprints',
        getValue: async () => {
            // eslint-disable-next-line new-cap
            const context = window.OfflineAudioContext ? new OfflineAudioContext(1, 44100, 44100) : new webkitOfflineAudioContext(1, 44100, 44100);
            const renderedBuffer = await applyFpExampleDataToAudio(context);
            const copiedData = new Float32Array(renderedBuffer.length);
            renderedBuffer.copyFromChannel(copiedData, 0, 0);

            const fingerprint = copiedData.slice(4500, 5000)
                .reduce(function (acc, val) { return acc + Math.abs(val); }, 0)
                .toString();
            return fingerprint;
        }
    },
    {
        id: 'audio-analyserNode-getByteTimeDomainData',
        category: 'full-fingerprints',
        getValue: async () => {
            // eslint-disable-next-line new-cap
            const context = window.OfflineAudioContext ? new OfflineAudioContext(1, 44100, 44100) : new webkitOfflineAudioContext(1, 44100, 44100);
            const analyser = context.createAnalyser();
            const dataArray = new Uint8Array(analyser.fftSize);

            await applyFpExampleDataToAudio(context, analyser);

            analyser.getByteTimeDomainData(dataArray);
            return dataArray.reduce((acc, val) => { return acc + Math.abs(val); }, 0);
        }
    },
    {
        id: 'audio-analyserNode-getFloatTimeDomainData',
        category: 'full-fingerprints',
        getValue: async () => {
            // eslint-disable-next-line new-cap
            const context = window.OfflineAudioContext ? new OfflineAudioContext(1, 44100, 44100) : new webkitOfflineAudioContext(1, 44100, 44100);
            const analyser = context.createAnalyser();
            const dataArray = new Float32Array(analyser.fftSize);

            await applyFpExampleDataToAudio(context, analyser);

            analyser.getFloatTimeDomainData(dataArray);
            return dataArray.reduce((acc, val) => { return acc + Math.abs(val); }, 0);
        }
    },
    {
        id: 'audio-analyserNode-getByteFrequencyData',
        category: 'full-fingerprints',
        getValue: async () => {
            // eslint-disable-next-line new-cap
            const context = window.OfflineAudioContext ? new OfflineAudioContext(1, 44100, 44100) : new webkitOfflineAudioContext(1, 44100, 44100);
            const analyser = context.createAnalyser();
            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            await applyFpExampleDataToAudio(context, analyser);

            analyser.getByteFrequencyData(dataArray);
            return dataArray.reduce((acc, val) => { return acc + Math.abs(val); }, 0);
        }
    },
    {
        id: 'audio-analyserNode-getFloatFrequencyData',
        category: 'full-fingerprints',
        getValue: async () => {
            // eslint-disable-next-line new-cap
            const context = window.OfflineAudioContext ? new OfflineAudioContext(1, 44100, 44100) : new webkitOfflineAudioContext(1, 44100, 44100);
            const analyser = context.createAnalyser();
            const dataArray = new Float32Array(analyser.frequencyBinCount);

            await applyFpExampleDataToAudio(context, analyser);

            analyser.getFloatFrequencyData(dataArray);
            return dataArray.reduce((acc, val) => { return acc + Math.abs(val); }, 0);
        }
    },
    {
        id: 'canvas-2d-todataurl',
        category: 'full-fingerprints',
        getValue: () => {
            const canvas = document.createElement('canvas');
            canvas.width = 2000;
            canvas.height = 200;
            canvas.style.display = 'inline';

            applyFpExampleDataToCanvas(canvas);

            return canvas.toDataURL();
        }
    },
    {
        id: 'canvas-2d-imagedata',
        category: 'full-fingerprints',
        getValue: () => {
            const canvas = document.createElement('canvas');
            canvas.width = 2000;
            canvas.height = 200;
            canvas.style.display = 'inline';

            applyFpExampleDataToCanvas(canvas);
            addCanvasToPage(canvas, 'Normal check');

            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            const image = new Image();
            image.src = canvas.toDataURL();
            addCanvasToPage(image, 'Image data url');

            // Verify that once the method is used that it looks the same once rendered to the screen
            const canvasCopy = document.createElement('canvas');
            canvasCopy.width = 2000;
            canvasCopy.height = 200;
            canvasCopy.style.display = 'inline';
            const ctxCopy = canvasCopy.getContext('2d');
            ctxCopy.putImageData(imageData, 0, 0);
            addCanvasToPage(canvasCopy, 'Image data check');

            return sha256(JSON.stringify([...imageData.data]));
        }
    },
    {
        id: 'canvas-2d-offscreen-todataurl',
        category: 'full-fingerprints',
        getValue: () => {
            const offscreen = new OffscreenCanvas(2000, 200);

            applyFpExampleDataToCanvas(offscreen);

            // As we can't get the result directly from the offscreen canvas
            // we then push it through to an on-screen canvas
            const imageBitmap = offscreen.transferToImageBitmap();

            const canvas = document.createElement('canvas');
            canvas.width = 2000;
            canvas.height = 200;
            canvas.style.display = 'inline';
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imageBitmap, 0, 0);

            addCanvasToPage(canvas, 'Offscreen canvas');

            return canvas.toDataURL();
        }
    },
    {
        id: 'canvas-webgl',
        category: 'full-fingerprints',
        getValue: () => {
            const canvas = document.createElement('canvas');
            canvas.width = 2000;
            canvas.height = 200;
            const gl = canvas.getContext('webgl');

            const vShaderTemplate = 'attribute vec2 attrVertex;varying vec2 varyinTexCoordinate;uniform vec2 uniformOffset;void main(){varyinTexCoordinate=attrVertex+uniformOffset;gl_Position=vec4(attrVertex,0,1);}';
            const fShaderTemplate = 'precision mediump float;varying vec2 varyinTexCoordinate;void main() {gl_FragColor=vec4(varyinTexCoordinate,0,1);}';
            const vertexPosBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
            const vertices = new Float32Array([-0.2, -0.9, 0, 0.4, -0.26, 0, 0, 0.732134444, 0]);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
            vertexPosBuffer.itemSize = 3;
            vertexPosBuffer.numItems = 3;
            const program = gl.createProgram();
            const vshader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vshader, vShaderTemplate);
            gl.compileShader(vshader);
            const fshader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fshader, fShaderTemplate);
            gl.compileShader(fshader);
            gl.attachShader(program, vshader);
            gl.attachShader(program, fshader);
            gl.linkProgram(program);
            gl.useProgram(program);
            program.vertexPosAttrib = gl.getAttribLocation(program, 'attrVertex');
            program.offsetUniform = gl.getUniformLocation(program, 'uniformOffset');
            gl.enableVertexAttribArray(program.vertexPosArray);
            gl.vertexAttribPointer(program.vertexPosAttrib, vertexPosBuffer.itemSize, gl.FLOAT, !1, 0, 0);
            gl.uniform2f(program.offsetUniform, 1, 1);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexPosBuffer.numItems);

            return gl.canvas.toDataURL();
        }
    },

    // optional - all props
    {
        id: 'window',
        category: 'all-props',
        getValue: () => {
            // ignore props that we already test
            const testedProps = tests.filter(t => t.category === 'window').map(t => t.id.match('window.([^.(]*).*')[1]);
            return extractSimplePropsFromObject(window, { excludeProps: testedProps });
        }
    },
    {
        id: 'navigator',
        category: 'all-props',
        getValue: () => {
            // ignore props that we already test
            const testedProps = tests.filter(t => t.category === 'navigator').map(t => t.id.match('navigator.([^.(]*).*')[1]);
            return extractSimplePropsFromObject(window.navigator, { excludeProps: testedProps });
        }
    },
    {
        id: 'screen',
        category: 'all-props',
        getValue: () => {
            // ignore props that we already test
            const testedProps = tests.filter(t => t.category === 'screen').map(t => t.id.match('screen.([^.(]*).*')[1]);
            return extractSimplePropsFromObject(window.screen, { excludeProps: testedProps });
        }
    },
    {
        id: 'headers',
        category: 'all-props',
        getValue: () => headers.then(res => {
            const testedHeaders = tests.filter(t => t.category === 'headers').map(t => t.id.match('headers - (.*)')[1]);
            const other = {};

            Object.keys(res.headers).forEach(k => {
                if (!testedHeaders.includes(k)) {
                    other[k] = res.headers[k];
                }
            });

            return other;
        })
    },

    // optional - events
    {
        id: 'deviceorientation',
        category: 'events',
        getValue: () => {
            let resolve;
            const promise = new Promise((res, rej) => { resolve = res; });

            window.addEventListener('deviceorientation', (event) => {
                resolve({
                    alpha: event.alpha,
                    beta: event.beta,
                    gamma: event.gamma
                });
            });

            return promise;
        }
    },
    {
        id: 'devicemotion',
        category: 'events',
        getValue: () => {
            let resolve;
            const promise = new Promise((res, rej) => { resolve = res; });

            window.addEventListener('devicemotion', (event) => {
                resolve({
                    accelerationX: event.acceleration.x,
                    accelerationY: event.acceleration.y,
                    accelerationZ: event.acceleration.z,
                    rotationRate: event.rotationRate,
                    interval: event.interval
                });
            });

            return promise;
        }
    },
    {
        id: 'wheel',
        category: 'events',
        getValue: () => {
            let resolve;
            const promise = new Promise((res, rej) => { resolve = res; });

            window.addEventListener('wheel', (event) => {
                resolve({
                    deltaX: event.deltaX,
                    deltaY: event.deltaY,
                    deltaZ: event.deltaZ,
                    deltaMode: event.deltaMode
                });
            });

            return promise;
        }
    },
    {
        id: 'touchstart',
        category: 'events',
        getValue: () => {
            let resolve;
            const promise = new Promise((res, rej) => { resolve = res; });

            window.addEventListener('touchstart', (event) => {
                resolve({
                    length: event.touches.length,
                    radiusX: event.touches[0].radiusX,
                    radiusY: event.touches[0].radiusY,
                    rotationAngle: event.touches[0].rotationAngle,
                    force: event.touches[0].force
                });
            });

            return promise;
        }
    },
    {
        id: 'ondevicelight',
        category: 'events',
        getValue: () => {
            let resolve;
            const promise = new Promise((res, rej) => { resolve = res; });

            window.addEventListener('ondevicelight', (event) => {
                resolve({
                    value: event.value
                });
            });

            return promise;
        }
    }
];

function extractSimplePropsFromObject (object, options) {
    const ignoredTypes = options.ignoredTypes || ['object', 'function', 'undefined'];
    const excludeProps = options.excludeProps || [];

    const result = {};

    for (const propName in object) {
        if (excludeProps.includes(propName)) {
            continue;
        }

        const propType = typeof object[propName];

        // ignore values of complex types
        if (ignoredTypes.includes(propType)) {
            result[propName] = `~${propType}~`;
            continue;
        }

        result[propName] = object[propName];
    }

    return result;
}

function applyFpExampleDataToAudio (context, analyzerNode) {
    let resolve;
    const promise = new Promise((res, rej) => { resolve = res; });

    const oscillator = context.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(10000, context.currentTime);

    const compressor = context.createDynamicsCompressor();

    [
        ['threshold', -50],
        ['knee', 40],
        ['ratio', 12],
        ['reduction', -20],
        ['attack', 0],
        ['release', 0.25]
    ].forEach(function (item) {
        if (compressor[item[0]] !== undefined && typeof compressor[item[0]].setValueAtTime === 'function') {
            compressor[item[0]].setValueAtTime(item[1], context.currentTime);
        }
    });

    context.oncomplete = (event) => {
        oscillator.disconnect();
        compressor.disconnect();

        resolve(event.renderedBuffer);
    };

    oscillator.connect(compressor);
    if (analyzerNode) {
        compressor.connect(analyzerNode);
        analyzerNode.connect(context.destination);
    } else {
        compressor.connect(context.destination);
    }
    oscillator.start(0);
    context.startRendering();

    return promise;
}
