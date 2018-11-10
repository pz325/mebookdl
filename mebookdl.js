#! /usr/bin/env node

const fetch = require("node-fetch");
const cheerio = require("cheerio");
const program = require("commander");
const pjson = require("./package.json");
const spawn = require("child_process").spawn;
const logger = require("./logger.js").logger;

const DEFAULT_EXTENSION = "azw3";
const SOBOOKS_URL_1 = "sobooks.cc/books";
const SOBOOKS_URL_2 = "www.sokindle.com/books";

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

const extractMebookDownloadPageUrl = htmlContent => {
    return extractUrl(htmlContent, "download.php");
};

const extractMebookBaiduPanUrl = htmlContent => {
    return extractUrl(htmlContent, "pan.baidu.com");
};

const extractSoBooksBaiduPanUrl = htmlContent => {
    const panUrl = extractUrl(htmlContent, "pan.baidu.com");
    // SoBooks BaiduPan Url is in format: https://sobooks.cc/go.html?url=https://pan.baidu.com/s/1kxfnxeDjIhEPHrLl0k6y0w
    const match = "url=";
    const startIndex = panUrl.indexOf(match) + match.length;
    return panUrl.substring(startIndex);
};

const extractMebookBaiduPanSecret = htmlContent => {
    // example "网盘密码：百度网盘密码：aagi     天翼云盘密码：5878"
    let secret = "";
    const match = "百度网盘密码：";
    const lenSecret = 4;
    const parsedHTML = cheerio.load(htmlContent);
    parsedHTML("p").map((i, text) => {
        const content = text.children[0];
        if (content && "data" in content && content.data.includes(match)) {
            const startIndex = content.data.indexOf(match) + match.length;
            logger.debug(
                `extractMebookBaiduPanSecret - secretText: ${content.data}`
            );
            secret = content.data.substring(startIndex, startIndex + lenSecret);
        }
    });
    return secret;
};

const extractSoBooksBaiduPanSecret = htmlContent => {
    /**
     * example
     *
     * <div class="e-secret">
     *      <strong style="font-size:20px; color:#F00; text-align:center;">提取密码：88kp</strong>
     * </div>
     */
    let secret = "";
    const match = "提取密码：";
    const lenSecret = 4;
    const parsedHTML = cheerio.load(htmlContent);
    const secretText = parsedHTML(".e-secret")
        .children()
        .html();
    // example secretText:   &#x63D0;&#x53D6;&#x5BC6;&#x7801;&#xFF1A;88kp
    logger.debug(`extractSoBooksBaiduPanSecret - secretText: ${secretText}`);
    const startIndex = 40; // 5 unicode characters
    secret = secretText.substring(startIndex, startIndex + lenSecret);
    return secret;
};

const downloadBook = async (url, extension) => {
    logger.info(`Downloading from ${url} with extension ${extension}`);
    if (url.includes(SOBOOKS_URL_1) || url.includes(SOBOOKS_URL_2)) {
        await downloadFromSoBooks(url, extension);
    } else {
        await downloadFromMebook(url, extension);
    }
};

const downloadFromSoBooks = async (url, extension) => {
    logger.debug(
        `downloadFromSoBooks - downloading ${url} with extension ${extension}`
    );
    const E_SECRET_KEY = "2018919";
    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
        },
        body: `e_secret_key=${E_SECRET_KEY}`
    })
        .then(resp => resp.text())
        .then(body => {
            const panUrl = extractSoBooksBaiduPanUrl(body);
            const secret = extractSoBooksBaiduPanSecret(body);
            logger.debug(
                `downloadFromSoBooks - panUrl: ${panUrl}, secret: ${secret}`
            );

            downloadFromBaiduPan(panUrl, secret, extension);
        });
};

const downloadFromMebook = async (url, extension) => {
    logger.debug(
        `downloadFromMebook - downloading ${url} with extension ${extension}`
    );
    fetch(url)
        .then(resp => resp.text())
        .then(body => extractMebookDownloadPageUrl(body))
        .then(downloadPageUrl => fetch(downloadPageUrl))
        .then(resp => resp.text())
        .then(body => {
            const panUrl = extractMebookBaiduPanUrl(body);
            const secret = extractMebookBaiduPanSecret(body);
            logger.debug(
                `downloadFromMebook - panUrl: ${panUrl}, secret: ${secret}`
            );

            downloadFromBaiduPan(panUrl, secret, extension);
        });
};

const downloadFromBaiduPan = (panUrl, secret, extension) => {
    logger.debug(`downloadFromBaiduPan - downloading from ${panUrl}`);
    downloadProcess = spawn(
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
        logger.info(`Downloading process exits with code ${exitCode}`);
    });
    downloadProcess.on("error", error => {
        logger.info(`Downloading process exits with Error ${error}`);
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
    .option("-d, --debug", "debug log")
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

if (program.debug) {
    logger.level = "debug";
}

downloadBook(program.url, extension);
