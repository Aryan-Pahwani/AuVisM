const { app, BrowserWindow, Tray, Menu, ipcMain } = require("electron");
const AutoLaunch = require("auto-launch");
const fs = require("fs");
const path = require("path");

const myAppAutoLauncher = new AutoLaunch({
  name: "MyApp",
  path: app.getPath("exe"),
});
myAppAutoLauncher
  .isEnabled()
  .then((isEnabled) => {
    if (!isEnabled) myAppAutoLauncher.enable();
  })
  .catch((err) => {
    console.error("Auto-launch failed:", err);
  });

let mainWindow;
let colorPickerWindow = null;
let tray = null;

function saveData(data) {
  const filePath = "src/Files/data.json";
  fs.writeFileSync(filePath, JSON.stringify(data));
}

function loadData() {
  const filePath = path.join("src/Files", "data.json");
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath));

    return data;
  }
  return null;
}

function createWindow() {
  const data = loadData();
  const windowConfig = data ? data.windowBounds : { width: 800, height: 600 };

  mainWindow = new BrowserWindow({
    ...windowConfig,
    frame: false,
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: false, // Add this line to handle cross-origin requests
    },
  });

  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  mainWindow.blur();
  mainWindow.loadFile("src/index.html");
  mainWindow.setFullScreenable(false);
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setResizable(false);

  mainWindow.on("close", () => {
    const windowBounds = mainWindow.getBounds();
    mainWindow.webContents.send("Settings-Data-Request");
    ipcMain.on("Settings-Data-Transfer", (event, partial_data) => {
      const data = {
        windowBounds: windowBounds,
        color: partial_data[0],
        noiseIntensity: partial_data[1],
        resolution: partial_data[2],
      };
      saveData(data);
      mainWindow = null;
    });
  });

  tray = new Tray(path.join(__dirname, "Files/sound-wave.png"));
  var contextMenu = Menu.buildFromTemplate([
    {
      label: "Edit Mode",
      type: "checkbox",
      click: () => {
        mainWindow.setIgnoreMouseEvents(!contextMenu.items[0].checked, {
          forward: true,
        });
        mainWindow.webContents.send("drag-state", contextMenu.items[0].checked);
        mainWindow.setResizable(contextMenu.items[0].checked);
      },
    },
    {
      label: "Settings",
      submenu: [
        {
          label: "Appearance",
          submenu: [
            {
              label: "Colour",
              click: () => {
                if (colorPickerWindow == null) createColorPickerWindow();
              },
            },
            {
              label: "Maximize",
              click: () => {
                mainWindow.hide();
                mainWindow.maximize();
              },
            },
          ],
        },
        {
          label: "Visualizer Settings",
          submenu: [
            {
              label: "Noise Intensity",
              submenu: [
                {
                  label: "High",
                  type: "radio",
                  click: () => {
                    mainWindow.webContents.send("noise-change", 40);
                  },
                },
                {
                  label: "Low",
                  type: "radio",
                  click: () => {
                    mainWindow.webContents.send("noise-change", 10);
                  },
                },
                {
                  label: "none",
                  type: "radio",
                  click: () => {
                    mainWindow.webContents.send("noise-change", 0);
                  },
                },
              ],
            },
            {
              label: "Resolution / Bar Count",
              submenu: [
                {
                  label: "crash",
                  type: "radio",
                  click: () => {
                    mainWindow.webContents.send("resolution-change", 4096);
                  },
                },
                {
                  label: "2048",
                  type: "radio",
                  click: () => {
                    mainWindow.webContents.send("resolution-change", 2048);
                  },
                },
                {
                  label: "1024",
                  type: "radio",
                  click: () => {
                    mainWindow.webContents.send("resolution-change", 1024);
                  },
                },
                {
                  label: "512",
                  type: "radio",
                  click: () => {
                    mainWindow.webContents.send("resolution-change", 512);
                  },
                },
                {
                  label: "256",
                  type: "radio",
                  click: () => {
                    mainWindow.webContents.send("resolution-change", 256);
                  },
                },
                {
                  label: "128",
                  type: "radio",
                  click: () => {
                    mainWindow.webContents.send("resolution-change", 128);
                  },
                },
                {
                  label: "64",
                  type: "radio",
                  click: () => {
                    mainWindow.webContents.send("resolution-change", 64);
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

function createColorPickerWindow() {
  colorPickerWindow = new BrowserWindow({
    width: 400,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });
  colorPickerWindow.loadFile("src/colorpicker/color.html");

  colorPickerWindow.setResizable(false);
  colorPickerWindow.on("closed", () => {
    colorPickerWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on("log", (event, message) => {
  console.log(message);
});

ipcMain.on("color-selected", (event, color) => {
  mainWindow.webContents.send("color-selected", color);
});

ipcMain.on("Load-Settings-Data-Request", (event) => {
  mainWindow.webContents.send("Start-Up-Data", loadData());
});
