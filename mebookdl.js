#! /usr/bin/env node

const fetch = require("node-fetch");
const cheerio = require("cheerio");
const program = require("commander");
const pjson = require("./package.json");
const spawn = require("child_process").spawn;

const DEFAULT_EXTENSION = "azw3";

const extractUrl = (htmlContent, match) => {
    let url = "";
    const parsedHTML = cheerio.load(htmlContent);
    parsedHTML("a").map((i, link) => {
        const href = cheerio(link).attr("href");
        if (href.includes(match)) {
            url = href;
        }
    });

    return url;
};

const extractDownloadPageUrl = htmlContent => {
    return extractUrl(htmlContent, "download.php");
};

const extractBaiduPanUrl = htmlContent => {
    return extractUrl(htmlContent, "pan.baidu.com");
};

const extractBaiduPanSecret = htmlContent => {
    // example "网盘密码：百度网盘密码：aagi     天翼云盘密码：5878"
    let secret = "";
    const match = "百度网盘密码：";
    const parsedHTML = cheerio.load(htmlContent);
    parsedHTML("p").map((i, text) => {
        const content = text.children[0];
        if (content && "data" in content && content.data.includes(match)) {
            const startIndex = content.data.indexOf(match) + 7;
            secret = content.data.substring(startIndex, startIndex + 4);
        }
    });
    return secret;
};

const downloadBook = async (url, extension) => {
    console.log(`Downloading from ${url} with extension ${extension}`);
    fetch(url)
        .then(resp => resp.text())
        .then(body => extractDownloadPageUrl(body))
        .then(downloadPageUrl => fetch(downloadPageUrl))
        .then(resp => resp.text())
        .then(body => {
            const panUrl = extractBaiduPanUrl(body);
            const secret = extractBaiduPanSecret(body);

            const downloadProcess = spawn(
                "python",
                [
                    "pan-baidu-download/bddown_cli.py",
                    "download",
                    panUrl,
                    "-S",
                    secret,
                    "-E",
                    extension,
                    "-D",
                    process.cwd()
                ],
                { cwd: __dirname, stdio: "inherit" }
            );
            downloadProcess.on("exit", exitCode => {
                console.log(`Downloading process exits with code ${exitCode}`);
            });
            downloadProcess.on("error", error => {
                console.log(`Downloading process exits with Error ${error}`);
            });
        });
};

const login = credential => {
    const [user, password] = credential.split(":");
    const downloadProcess = spawn(
        "python",
        ["pan-baidu-download/bddown_cli.py", "login", user, password],
        { cwd: __dirname, stdio: "inherit" }
    );
    downloadProcess.on("exit", exitCode => {
        console.log(`Login process exits with code ${exitCode}`);
    });
    downloadProcess.on("error", error => {
        console.log(`Login process exits with Error ${error}`);
    });
};

program
    .version(pjson.version)
    .option("-u, --url <url>", "mebook book page URL")
    .option("-e, --extension <extension>", "ebook extension, default to azw3")
    .option(
        "--login <login>",
        "login credential, in format of <user>:<password>"
    )
    .parse(process.argv);

const printHelp = () => {
    console.log("Usage: node mebookdl --url <mebook book page URL>");
};

if (!program.url) {
    program.help();
    process.exit();
}

const extension = program.extension ? program.extension : DEFAULT_EXTENSION;
if (program.login) {
    login(program.login);
}

downloadBook(program.url, extension);
