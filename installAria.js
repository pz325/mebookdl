const osVar = process.platform;
const isMac = osVar === "darwin";
const isWin = osVar === "win32";
const execSync = require("child_process").execSync;
const request = require("request");
const fs = require("fs");
const path = require("path");
const unzip = require("unzip");

const installAriaMac = () => {
    const cmd = "brew install aria2";
    execSync(cmd);
};

const installAriaWin = () => {
    const aria2Url =
        "https://github.com/aria2/aria2/releases/download/release-1.34.0/aria2-1.34.0-win-64bit-build1.zip";
    const aria2ZipFilename = "aria2.zip";
    const aria2ExecFilename = "aria2c.exe";
    const target = path.join(path.resolve("./"), aria2ExecFilename);

    if (fs.existsSync(target)) {
        fs.unlinkSync(target);
    }

    if (fs.existsSync(aria2ZipFilename)) {
        fs.unlinkSync(aria2ZipFilename);
    }

    const zipStream = fs.createWriteStream(aria2ZipFilename);
    zipStream.on("finish", () => {
        fs.createReadStream(aria2ZipFilename)
            .pipe(unzip.Parse())
            .on("entry", function(entry) {
                var fileName = entry.path;
                if (fileName.includes(aria2ExecFilename)) {
                    entry.pipe(fs.createWriteStream(target));
                } else {
                    entry.autodrain();
                }
            });

        fs.unlinkSync(aria2ZipFilename);
    });

    request(aria2Url).pipe(zipStream);
};

const installAria = () => {
    if (isMac) {
        installAriaMac();
    } else if (isWin) {
        installAriaWin();
    } else {
        console.error(`Unsupported OS: ${osVar}`);
    }
};

module.exports = {
    installAria: installAria
};
