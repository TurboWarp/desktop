const require = (function() {
    let globalIpcCounter = 0;
    const ipcInFlight = {};

    AndroidIpcAsync.onmessage = (e) => {
        const data = e.data;
        const ipcObject = ipcInFlight[data.messageId];
        if (!ipcObject) {
            throw new Error(`Received async IPC with unknown ID ${data.messageId}`);
        }

        if (data.success) {
            ipcObject.resolve(data.result);
        } else {
            ipcObject.reject(data.result);
        }

        delete ipcObject[data.messageId];
    };

    const contextBridge = {
        exposeInMainWorld: (objectName, objectImplementation) => {
            window[objectName] = objectImplementation;
        }
    };

    const ipcRenderer = {
        sendSync: (method, ...args) => {
            const response = AndroidIpcSync.sendSync(JSON.stringify({
                method,
                args
            }));
            return JSON.parse(response);
        },

        invoke: (method, ...args) => new Promise((resolve, reject) => {
            const messageId = globalIpcCounter++;
            ipcInFlight[messageId] = {
                resolve,
                reject
            };

            console.log('Sending', method, args);

            AndroidIpcAsync.postMessage({
                messageId,
                method,
                arguments: args
            });
        }),
    };

    return (moduleName) => {
        if (moduleName === "electron") {
            return {
                contextBridge,
                ipcRenderer
            };
        }

        throw new Error(`Mock require() found unknown module: ${moduleName}`);
    };
}());
