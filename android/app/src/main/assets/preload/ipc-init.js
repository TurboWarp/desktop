const require = (function() {
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
        invoke: (method, ...args) => {}
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
