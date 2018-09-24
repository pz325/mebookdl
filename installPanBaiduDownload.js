const execSync = require("child_process").execSync;
const fs = require("fs");

const installPanBaiduDownload = () => {
    let cmd = "";
    if (fs.existsSync("pan-baidu-download")) {
        cmd = "cd pan-baidu-download && git pull";
    } else {
        cmd = "git clone https://github.com/pz325/pan-baidu-download.git";
    }

    execSync(cmd);
}

module.exports = {
    installPanBaiduDownload: installPanBaiduDownload
}
