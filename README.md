# Downloader CLI for mebook.cc
Command line tool for downloading ebooks from http://mebook.cc

Support MacOS only

Now also support https://sobook.cc
## Prerequisition
* git 
    (`xcode-select install` or `brew install git`)
* https://github.com/pz325/pan-baidu-download
    * python 2.7+
    * Requests (`pip install requests`)
    * aria2 (`brew install aria2`)
    * (Both `pan-baidu-download` and `aria2` are installed as part of mebookdl post install script.)

## Installation
```
npm install -g mebookdl
```

## Usage
Quick check the installation
```
mebookdl -h
```

By default mebookdl downloads only `azw3` format.
```
mebookdl -u http://mebook.cc/22827.html
```

To download `epub` format.
```
mebookdl -u http://mebook.cc/22827.html -e epub
```

To download from [SoBooks](https://sobooks.cc/).
```
mebookdl -u https://sobooks.cc/books/10280.html
```
## Todo
* Support Windows
* Make mebookdl a Chrome Extension