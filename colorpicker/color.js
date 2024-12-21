// Color Function //
let colorIndicator = document.getElementById('color-indicator');
const colorPicker = new iro.ColorPicker("#color-picker", {
    width:150, color: "rgba(164, 0, 0, 0.6)", layout:
          [
            { 
                component: iro.ui.Wheel,
              },
              { 
                component: iro.ui.Slider,
              },
              { 
                component: iro.ui.Slider,
                options: {
                    sliderType: 'alpha'
                }
              }
        ]
});
colorPicker.on('input:end', function(color) {
    window.electron.ipcRenderer.send('color-selected', colorPicker.color.rgbaString);
    
});

