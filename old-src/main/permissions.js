// import {BrowserWindow, dialog, systemPreferences} from "electron";
// import {getTranslation} from "./translations";

// const mediaTypeToPermissionType = {
//   audio: 'microphone',
//   video: 'camera'
// };

// const askForMediaAccess = mediaType => {
//   if (systemPreferences.askForMediaAccess) {
//     return systemPreferences.askForMediaAccess(mediaTypeToPermissionType[mediaType]);
//   }
//   // TODO: for now we'll just assume we have access which is usually the case
//   // in the future we should see if it's possible to detect this in snap and flatpak
//   return true;
// };

// const showPermissionDeniedWarning = (window, mediaType) => {
//   const title = getTranslation(`permission.${mediaType}-denied`);
//   const description = getTranslation(`permission.${mediaType}-denied-description`);
//   // This prompt currently is only visible in macOS
//   const instructions = getTranslation('permission.macos-instructions');
//   dialog.showMessageBox(window, {
//     type: 'warning',
//     message: title,
//     detail: `${description}\n\n${instructions}`
//   });
// };

// const handlePermissionRequest = async (webContents, permission, callback, details) => {
//   if (!details.isMainFrame) {
//     // We don't trust subframes
//     return callback(false);
//   }

//   if (permission === 'fullscreen') { 
//     // Allow any windows to enter fullscreen
//     return callback(true);
//   }

//   if (permission === 'pointerLock') {
//     // Packager has a pointer lock feature
//     return callback(true);
//   }

//   if (permission === 'openExternal') {
//     // This will be checked in other places
//     return callback(true);
//   }

//   if (permission === 'notifications') {
//     // Used by notification extension
//     return callback(true);
//   }

//   if (permission === 'media') {
//     // mediaTypes is not guaranteed to exist
//     const mediaTypes = details.mediaTypes || [];
//     for (const mediaType of mediaTypes) {
//       if (mediaType === 'audio' || mediaType === 'video') {
//         const hasPermission = await askForMediaAccess(mediaType);
//         if (!hasPermission) {
//           const window = BrowserWindow.fromWebContents(webContents);
//           showPermissionDeniedWarning(window, mediaType);
//           return callback(false);
//         }
//       } else {
//         console.log(`Unknown media type: ${mediaType}`);
//         return callback(false);
//       }
//     }
//     return callback(true);
//   }

//   console.log(`Unknown permission: ${permission}`);
//   return callback(false);
// };

// export {
//   handlePermissionRequest
// };
