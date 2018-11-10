const execSync = require("child_process").execSync;
const fs = require("fs");

const installPanBaiduDownload = () => {
    let cmd = "";
    if (fs.existsSync("pan-baidu-download")) {
        cmd = "cd pan-baidu-download && git pull && pip install -r requirements.txt";
    } else {
        cmd = "git clone https://github.com/pz325/pan-baidu-download.git && pip install -r requirements.txt";
    }

    execSync(cmd);
};

module.exports = {
    installPanBaiduDownload: installPanBaiduDownload
};
