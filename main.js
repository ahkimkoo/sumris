const {
    app,
    BrowserWindow,
    Tray,
    nativeImage,
    globalShortcut,
    powerSaveBlocker,
    ipcMain
} = require('electron')
const path = require('path')
const arex = require('./lib/arex/arex.js')
const nodejieba = require('nodejieba')


const title = 'All social change comes from the passion of individuals'
const icon = nativeImage.createFromPath(path.join(__dirname, 'asset/images/icon.png'))


let win, timer,
    actived = false

Date.prototype.Format = function(fmt) {
    var o = {
        "M+": this.getMonth() + 1,
        "d+": this.getDate(),
        "h+": this.getHours(),
        "m+": this.getMinutes(),
        "s+": this.getSeconds(),
        "q+": Math.floor((this.getMonth() + 3) / 3),
        "S": this.getMilliseconds()
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

const debug = (msg) => {
    msg = `[${new Date().Format('MM-dd hh:mm:ss.S')}] ${msg}`
    if (win) win.webContents.send('main-log', msg)
    console.log(msg)
}

const createWindow = () => {
    win = new BrowserWindow({
        width: 860,
        height: 640,
        show: false,
        icon: icon,
        'title': title,
        webPreferences: {
            webSecurity: false,
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'asset/scripts/inject.js')
        }
    })

    win.setMenuBarVisibility(false)

    win.loadURL(`file://${__dirname}/asset/index.html`)
    // win.loadURL('https://wx.qq.com/?lang=zh_CN')

    // win.webContents.openDevTools()

    win.on('closed', () => {
        win = null
    })

    win.on('ready-to-show', (e) => {
        win.show()
    })

    win.webContents.on('did-finish-load', () => {
        if (actived) {
            //don't check ix data any more
        } else {
            actived = true
        }
        // let css = fs.readFileSync(path.join(__dirname, 'asset/styles/default.css'), 'utf-8');
        // win.webContents.insertCSS(css);

        // timer = setTimeout(() => {
        //     win.webContents.reload()
        // }, 80000)
    })

    let tray = new Tray(icon)

    tray.setToolTip(title)

    tray.on('click', () => {
        win.isVisible() ? win.hide() : win.show()
    })
    win.on('show', () => {
        tray.setToolTip(title)
        // tray.setHighlightMode('always')
    })
    win.on('hide', () => {
        tray.setToolTip(title)
        // tray.setHighlightMode('never')
    })

    globalShortcut.register('f12', () => {
        if (win.webContents.isDevToolsOpened()) win.webContents.closeDevTools()
        else win.webContents.openDevTools()
    })

    globalShortcut.register('CommandOrControl+shift+i', () => {
        if (win.webContents.isDevToolsOpened()) win.webContents.closeDevTools()
        else win.webContents.openDevTools()
    })

    const psbid = powerSaveBlocker.start('prevent-display-sleep')
        // powerSaveBlocker.stop(psbid)
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (win === null) {
        createWindow()
    }
})

app.on('before-quit', () => {
    if (win) {
        win.removeAllListeners('close')
        win.close()
    }
    if (timer) clearTimeout(timer)
});

ipcMain.on('get-article', (event, link) => {
    arex.get_article(link, false, (err, result) => {
        event.reply('got-article', err?{}:result)
        // event.reply('got-article', err?"":JSON.stringify(result))
    });
})

ipcMain.on('get-summary', (event, param) => {
    let summary = arex.summarize(param.content, param.wordcount, param.shingle);
    event.reply('got-summary', summary)
})

ipcMain.on('get-keywords', (event, content, count) => {
    let keywords = nodejieba.extract(content, count)
    event.reply('got-keywords', keywords)
})

/*
ipcMain.on('win-articles', (event, arg) => {
    updateArticleFinger(arg, err=>{
        debug('refresh article via win-articles, error: '+err);
    })
})

ipcMain.on('win-chat-message', (event, arg) => {
    checkChatMessage(arg)
})

ipcMain.on('win-member-list', (event, arg) => {
    loadContactCache(arg)
})
*/
// process.on('uncaughtException', (err) => {
// })