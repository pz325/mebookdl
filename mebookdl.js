const fetch = require("node-fetch");
const cheerio = require("cheerio");
const program = require("commander");
const pjson = require('./package.json');
const execSync = require("child_process").execSync;

// const url = "http://mebook.cc/22773.html";
const DEFAULT_EXTENSION = "azw3";

const extractUrl = (htmlContent, match) => {
    let url = "";
    const parsedHTML = cheerio.load(htmlContent);
    parsedHTML('a').map((i, link) => {
        const href = cheerio(link).attr('href');
        if (href.includes(match)) {
            url = href;
        }
    });

    return url;
}

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
}

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
            const cmd = `python pan-baidu-download/bddown_cli.py download ${panUrl} -S ${secret} -E ${extension}`;
            console.log(cmd);
            console.log(execSync(cmd));
        });
}

program
    .version(pjson.version)
    .option('-u, --url <url>', 'mebook book page URL')
    .option('-e, --extension <extension>', 'ebook extension, default to azw3')
    .parse(process.argv);

const printHelp = () => {
    console.log('Usage: node mebookdl --url <mebook book page URL>');
}

if (!program.url) {
    program.help();
    process.exit();
}

const extension = program.extension ? program.extension : DEFAULT_EXTENSION;
downloadBook(program.url, extension);