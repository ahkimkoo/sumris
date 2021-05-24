const {ipcRenderer} = require('electron')

const debug = function(msg){
	console.log(msg);
}

ipcRenderer.on('main-log', (event, message) => {
      debug(message)
})