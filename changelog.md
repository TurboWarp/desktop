This document is the authoritative source for TurboWarp's changelogs. Everything else gets generated from this list by `node scripts/generate-changelogs.jsm`.

Prefix notes with "Windows:", "macOS:", or "Linux:" as needed. Do not use **formatting** or [links](https://desktop.turbowarp.org/).

# 1.15.0 (2025-10-19)

 - New compiler runs some projects twice as fast
 - Added face sensing extension. It uses a machine learning model that runs on your computer, so it works offline. Your webcam feed is never uploaded to any server
 - Local storage extension no longer requires manually configuring namespace
 - Newgrounds extension significantly improved
 - Fixed "Unexpected status 503" errors when packaging certain projects
 - Windows: Fixed broken text boxes after choosing "Stay" in the unsaved changes confirmation dialog
 - macOS: Fixed poor performance on macOS 26
 - macOS: macOS 11 users now have to use a special legacy version of the app which is slower and less secure than the regular version
 - Linux: If you use a Wayland compositor, the app will now use native Wayland instead of the Xwayland compatibility layer
 - Linux: Changed executable name back to "turbowarp-desktop" after unintentional change in previous update

# 1.14.5 (2025-08-28)

 - Optimized stamps when using the Animated Text extension
 - Added code signing for some Windows builds using free using code signing provided by SignPath.io and certificate by SignPath Foundation

# 1.14.4 (2025-06-12)

 - Reduced size of packaged projects by 400KB
 - Fixed some large projects not working when packaged
 - Fixed Clipping and Blending extension
 - Improved performance of Animated Text extension when many clones have been created and deleted
 - Improved performance of Camera V2 extension when many clones have been created and deleted
 - Improved performance of Simple 3D extension while mouse is pressed

# 1.14.2 (2025-05-30)

 - Significantly optimize saving large projects
 - Fixed a series of security bugs related to vector costumes
 - Fixed various extension bugs

# 1.14.0 (2025-03-12)

 - New extension: Camera V2
 - Fixed text bubble font
 - Fixed compiler bugs caused by incorrect variable type assumptions after running block in compatibility layer
 - Fixed interpreter bugs caused by recursive custom blocks using "stop this script" blocks
 - Fixed various other bugs
 - macOS: macOS 10.15 devices now need to install a special "legacy" version of the app. It has the same features but will be less secure over time
 - Linux: Fixed importing sprites on some systems

# 1.13.2 (2025-02-02)

 - Fixed disable cloud variables option in the "Edit" menu
 - Fixed pause button in packaged projects not adjusting timers used by blocks like "glide to" when unpausing
 - Fixed pause button in packaged projects not pausing videos from the video extension
 - Fixed files extension failing to download files in packaged projects
 - Fixed pointerlock extension returning incorrect values for y position
 - Fixed more motion extension "direction to" block returning values in incorrect range
 - Fixed more timers extension being affected by system time changes
 - Windows: Fixed app name in task manager

# 1.13.0 (2025-01-24)

 - Added Steamworks extension
 - Extension documentation opens inside the app and does not require an internet connection
 - Optimized pen rendering
 - Improved reliability of file saving
 - Removed restricted trademarks
 - Various bug fixes and security hardening

# 1.12.3 (2024-06-02)

 - Fixed one-time data migration from versions before 1.9.0
 - Fixed default URL in video extension

# 1.12.1 (2024-05-28)

 - Updated packager
 - Linux: Fixed incorrect metadata in .desktop launcher causing some desktop environments to behave strangely
 - Linux: Flatpak version now detects drag-and-drop-related permission issues and suggests how to fix them

# 1.12.0 (2024-05-27)

 - New extensions: Pen Plus V7, Simple 3D, Mobile Keyboard, Numerical Encoding V2, Ask Before Closing Tab, Font Manager
 - Added cloud variables synchronization between all open desktop app windows. This can be disabled under the "Edit" menu
 - Added optional Rich Presence support. This can be enabled under the "Settings" menu then "Desktop Settings"
 - Optimized project loading by about 10%
 - Improved high contrast extension colors
 - Fixed protocol handler errors
 - Fixed "Allow extensions to access any website" not allowing certain websites to be embedded using Iframe extension
 - Various other bug fixes

# 1.11.1 (2024-04-13)

 - Fixed addon errors

# 1.11.0 (2024-04-07)

 - New addon: Multiple rows in backpack
 - New extensions: List Tools, XML, Key Simulation
 - The dango has become a cat
 - Enabled Debugger addon performance tab
 - Restored Scratch font with a new font that looks similar but without legal ambiguity
 - Fixed various fullscreen-related bugs
 - Various other bug fixes
 - Windows: Restored 32-bit installers for Windows 7, 8, and 8.1
 - macOS: macOS 10.13 and 10.14 users will have to install a special "legacy" version of the app
 - Linux: Fixed WebGL ("uniformSetters") errors on some distributions and Flatpak
 - Linux: Fixed segfault on Wayland

# 1.10.1 (2024-02-05)

 - Windows: Support for Windows 7, 8, and 8.1 has not been removed, however you will have to download a special version of the app that uses old versions of libraries. This is slower and less secure, but we will support it as long as it's not an unreasonable burden
 - New addons: Rearrangeable custom block inputs, Skewing in costume editor, Square block text inputs, Compact editor, Customizable menu bar, Copy reporter values, Move sprite to front layer, Arrow key incrementation in editor
 - New extensions: WebSocket, Pen+ V6, Asset Manager, HTML encoding
 - Insert blocks by name addon was rewritten and works so much better
 - Added high contrast mode
 - Added dark blocks mode
 - Added option to change accent color from red to blue or purple
 - Added progress bar when loading projects from your computer
 - Added more stage size controls when using large custom stage sizes
 - Added support for generating Electron apps for ARM Linux computers
 - Added many new APIs for extensions
 - Fixed scripts imported from the backpack dropping in the wrong spot
 - Fixed gamepad support and costume editor snapping addons when using custom stage sizes
 - Fixed scroll bars when using custom stage sizes
 - Fixed wake lock extension
 - Fixed too many bugs to list here
 - Removed hidden "Scratch" font due to license ambiguities (Custom fonts can be used as a workaround)

# 1.9.3 (2023-09-18)

 - Fixed one-time data migration process not running sometimes

# 1.9.2 (2023-09-17)

 - Fixed some edge cases in file saving and the one-time data migration process

# 1.9.1 (2023-09-13)

 - Fixed option to create cloud variables missing
 - Fixed custom username not saving
 - Fixed bugs in the one-time data migration process
 - Slightly optimized startup time
 - macOS: Update menu bar

# 1.9.0 (2023-09-08)

 - Desktop app was rewritten for improved security
 - Added custom reporters
 - Added custom fonts
 - Added 15+ new extensions including Clipboard, More Motion, Iframe, Color picker, Custom Styles, and Wake Lock
 - New restore point system that is more reliable, more efficient, and stores multiple restore points instead of just one
 - The builtin extension, costume, backdrop, and sprite libraries let you mark items as favorites
 - Extension gallery is now built into the extension list, not a separate window
 - New update checker that shows you the changelog for each new version
 - Can now ignore misspelled words or turn off the spellchecker entirely
 - Allow importing .ogg, .flac, and .aac audio files
 - Removed "for each" block from the palette because it causes various issues
 - Improved error handling
 - Fixed backpacking scripts and sprites that contain custom extensions
 - Fixed text to speech blocks
 - Fixed a lot of bugs

# 1.8.1 (2023-06-20)

 - Fixed issues using custom extensions in the packager (if issues remain, press "Reset All Settings" in packager)
 - Fixed using an extension to fetch files from extensions.turbowarp.org in the editor
 - Fixed Looks Plus "this sprite" option not working properly in clones

# 1.8.0 (2023-06-19)

 - Added more than 40 new extensions including Animated Text (like Scratch Lab), Local Storage, BigInt, JSON, Clipping and Blending, Sensing Plus, Clones Plus, Looks Plus, and RegExp
 - Updated many extensions including Stretch, Runtime Options, and Files
 - To protect user privacy, builtin extensions now ask for permission before allowing the project to contact untrusted websites
 - Custom extensions can now be loaded from files or text
 - Added option to allow extensions to bypass CORS
 - Added "random direction" option to point towards block
 - Fixed script execution order occasionally changing after saving project
 - Fixed zooming with ctrl+plus on some keyboard layouts
 - Fixed exporting addon settings
 - Fixed many other bugs
 - Windows: Support for Windows 7, 8, and 8.1 will be removed in a future release
 - Windows: Added native support for Windows on ARM

# 1.7.1 (2023-01-24)

 - Added support for unsandboxed extensions from extensions.turbowarp.org
 - The desktop app includes an offline copy of extensions.turbowarp.org
 - Custom extensions will now be automatically loaded when you open a project made with recent versions of TurboWarp (a confirmation prompt appears for third-party extensions)
 - Project saving now uses significantly less memory
 - The old button to open the packager in the "?" menu has been moved; use the button in the "File" menu instead. The old button has mentioned the new location for a while. This matches the web app.
 - Added "Rename broadcasts" addon (enabled by default)
 - Added "Collapsing sprite properties" addon
 - Added "Costume editor snapping" addon
 - Added "Project volume slider" addon
 - Added "Always show number pad" addon
 - Added a few more switches to the "Block switching" addon
 - Checkboxes in the toolbox are now dark in dark mode
 - Allow creating monitors for mouse down, mouse x, mouse y, and days since 2000
 - Fixed crash in costume editor using transparent colors with bitmap line tool
 - Fixed costume editor color picker ignoring transparency
 - Fixed some keyboard shortcuts not working when caps lock is enabled
 - Fixed many other bugs
 - Windows: Support for Windows 7, Windows 8, and Windows 8.1 may be removed in a future update
 - macOS: Our app is now notarized by Apple

# 1.6.1 (2022-10-07)

 - Fixed features that access your microphone or camera
 - Fixed addon settings import not importing some color options

# 1.6.0 (2022-10-02)

 - New addon: Pick colors from stage (enabled by default)
 - New addon: Zebra striping
 - Bitmap costume editor now supports transparency
 - SVGs exported by TurboWarp and imported to TurboWarp won't be re-centered unnecessarily
 - Sound editor now shows a sound's size, whether it's stereo or not, and its sample rate
 - Maximum SVG size has been reverted to the same as Scratch due to too many crashes
 - Added option to clone counter to only show icon
 - Added "Turbo Robot" sprite to builtin libraries
 - Added option to customizable new sprite position to apply to duplicated sprites
 - Fixed "Saving project..." text disappearing before the project was actually saved
 - Fixed save location still being updated if you cancel the confirmation to replace existing project
 - Fixed unnecessary memory use when saving files
 - Fixed loading some projects with many bitmap costumes
 - Fixed block cherry picking breaking on certain blocks
 - Fixed tangent block reporting slightly incorrect values in the compiler
 - Fixed display stage on left side and two-column category menu compatibility bugs
 - Fixed developer tools dark mode issue
 - Fixed auto-hiding block palette bugs
 - Fixed variable manager bugs
 - Fixed sound editor layout bugs at certain window sizes
 - Fixed some costume and sound lists having an unnecessary horizontal scrollbar
 - Fixed color picker overlay not covering the entire page
 - Fixed some icons being unnecessarily draggable
 - Fixed loading Scratch 2 projects with unusual JSON
 - Windows: Title bar now respects your computer's dark mode preference
 - Linux: We now have a repository for Debian/Ubuntu and their derivatives
 - Updated packager: settings export and import, optimized memory use of packaged projects

# 1.5.0 (2022-07-23)

 - New addon: Reverse order of project controls
 - New addon: Hide stage and sprite pane
 - Allow creating unlimited cloud variables
 - Fixed backpacking JPEG costumes
 - Fixed turbo mode stored in projects not applying properly
 - Added option to disable hidden window throttling
 - Fixed some bugs in the auto-hiding block palette addon
 - Linux: Support for 32-bit x86 has been removed
 - macOS: Fixed uncloseable packager windows if opened from a fullscreen editor window
 - Updated packager: list color, version number, macOS Electron, Scratch Link support, more

# 1.4.0 (2022-06-24)

 - Moved the builtin copy of the TurboWarp Packager to the File > Package project menu
 - Added a sound duration indicator to the sound editor
 - Added partial support for the "Threads" tab in the debugger addon, including single stepping
 - Fixed high CPU usage when project is paused
 - Increased maximum resolution of large vector costumes
 - Updated backpacked item previews to support transparency
 - Updated dark mode with improved inputs, improved scrollbars, and support for the debugger and gamepad addons
 - Fixed developer tools find bar covering up controls in certain conditions
 - Fixed variable manager causing crashes when variables are too large
 - Improved style of many modals and prompts to be more cohesive
 - Fixed block context menus immediately selecting item and closing after being opened on some systems
 - Fixed interface allowing invalid framerates and invalid stage sizes
 - Fixed custom extensions being able to corrupt projects if they return unexpected values
 - Fixed custom extension error handling
 - Fixed various other bugs
 - Linux: Support for 32-bit x86 systems will be removed in v1.5.0 (32-bit ARM is not affected)
 - Linux: Added support for Linux on Apple Silicon
 - macOS: Reduced app startup time
 - Added donation links
 - Updated packager: adds support for "☁ room id" special cloud behavior

# 1.3.1 (2022-05-18)

 - Fixed crash on some Linux systems
 - Gamepad addon now supports buttons other than the left button and is compatible with pointerlock in the packager
 - Updated packager: relicensed to Apache 2.0 from LGPL3.0 for fewer restrictions, added "☁ set clipboard" and "☁ pasted" support to special cloud behaviors
 - Various other bug fixes

# 1.3.0 (2022-05-03)

 - New addon: Customizable default costume editor colors
 - The app now registers itself as a file handler for .sb and sb2 files in addition to .sb3
 - Optimized comparison blocks
 - Fixed more crashes on app startup on some systems

# 1.2.2 (2022-04-13)

 - Fixed mouse actions in gamepad support addon in packager
 - Fixed blocks like "insert x at any of list" to insert at a random location

# 1.2.1 (2022-04-10)

 - Fixed crash on startup on some systems
 - All windows now have proper language hints, fixes CJK characters looking weird in some windows
 - Added error message when any child process dies unexpectedly, not just renderer processes

# 1.2.0 (2022-04-09)

 - Added option to configure which microphone and camera the app should use
 - Added option to disable hardware acceleration
 - Fixed stage size stored in projects
 - Reduced costume editor flicker when switching costumes
 - Added text inputs to costume editor color components
 - Fixed monitor position after resizing stage
 - Fixed vertical centering of variable monitor values in certain conditions
 - Fixed lines between tiled stamps when high quality pen is enabled
 - Reduced lag related to folders addon

# 1.1.3 (2022-2-21)

 - Fixed "Mouse position" addon

# 1.1.2 (2022-02-20)

 - Fixed automatically loading project in packager
 - Fixed significant lag when displaying variable monitors caused by the "Hide new variables" addon
 - Fixed builtin sound library not working when offline or in certain regions of the world (China)
 - "Remove Miscellaneous Limits" now also disables mouse X and Y coordinate rounding

# 1.1.1 (2022-2-13)

 - New addon: Customizable block text style
 - New addon: Search sprites by name
 - New addon: Enhanced full screen
 - The right-click menu on a variable monitor now has an option to hide it
 - Stage size can now be changed without reloading the editor
 - Stage size can now be stored in a project
 - Fix storing gamepad settings in projects
 - Fix onion skinning layers being slightly misplaced
 - Improve sound editor performance on very large sounds
 - Updated packager
 - Many bug fixes

# 1.0.0 (2022-1-15)

 - The costume editor now supports dark mode
 - If a dark background makes it hard to edit your costumes, it's possible to change the theme of the costume editor without effecting the rest of the interface
 - Significantly optimized memory use of costumes
 - Improved project exporting to compress project.json by up to to 30%
 - Many compiler optimizations and compatibility fixes
 - When you right click on a misspelled word detected by the spellchecker, you will now see some suggested replacements
 - Updated integrated packager
 - Various bug fixes
 - Updated translations
