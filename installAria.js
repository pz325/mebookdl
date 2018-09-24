const osVar = process.platform;
const isMac = osVar === "darwin";
const isWin = osVar === "win32";
const execSync = require("child_process").execSync;


const installAria = () => {
    if (isMac) {
        const cmd = "brew install aria2";
        execSync(cmd);
    }
}

module.exports = {
    installAria: installAria
}