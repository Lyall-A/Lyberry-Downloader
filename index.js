const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");

const checkIfDirectory = require("./utils/checkIfDirectory");
const readDirectory = require("./utils/readDirectory");

const baseUrl = "https://files.lyberry.com";

const downloadPath = process.argv[2];
if (!downloadPath) return;
const savePath = process.argv[3] || path.resolve(path.basename(decodeURIComponent(downloadPath)));

const startDate = new Date();
let fileCount = 0;

(function downloadRecursively(fullDownloadPath, fullSavePath, isDirectory = null) {
    return new Promise((resolve, reject) => {
        if (isDirectory) fs.mkdirSync(fullSavePath, { recursive: true });
        if (isDirectory === false && fs.existsSync(fullSavePath)) return resolve();

        const shortPath = decodeURIComponent(fullDownloadPath.replace(downloadPath, "")) || "/";
        
        if (isDirectory) console.log(`Reading directory '${shortPath}'`);
        if (isDirectory === false) console.log(`Downloading '${shortPath}'`);
        if (isDirectory === null) console.log(`Checking '${shortPath}'`);

        fetch(`${baseUrl}${fullDownloadPath}`).then(res => {
            const httpStream = Readable.fromWeb(res.body);
            const contentLength = res.headers.get("Content-Length");
            const downloadStartDate = new Date();
            let fileStream = isDirectory === false ? fs.createWriteStream(fullSavePath) : null;
            let dataChunks = [];
            
            httpStream.on("data", chunk => {
                if (isDirectory !== false) dataChunks.push(chunk);
                if (isDirectory === null) {
                    if (dataChunks.length <= 2) {
                        if (checkIfDirectory(Buffer.concat(dataChunks))) {
                            isDirectory = true;
                            fs.mkdirSync(fullSavePath, { recursive: true });
                            console.log(`Reading directory '${shortPath}'`);
                        }
                    } else {
                        isDirectory = false;
                        if (fs.existsSync(fullSavePath)) {
                            httpStream.destroy();
                            return resolve();
                        }
                        fileStream = fs.createWriteStream(fullSavePath);
                        for (const chunk of dataChunks) fileStream.write(chunk);
                        dataChunks = null;
                        console.log(`Downloading '${shortPath}'`);
                    }
                }
                if (isDirectory === false) {
                    fileStream.write(chunk);
                    const percentage = Math.round((fileStream.bytesWritten / contentLength * 100) * 100) / 100;
                    process.stdout.write("\x1b[1A");
                    process.stdout.write("\x1b[2K");
                    process.stdout.write(`Downloading '${shortPath}' - ${percentage}%\n`);
                }
            });
            
            httpStream.on("end", async () => {
                if (isDirectory) {
                    const directoryContents = readDirectory(Buffer.concat(dataChunks));
                    for (const directoryContent of directoryContents) {
                        await downloadRecursively(path.join(fullDownloadPath, directoryContent.name), path.join(fullSavePath, directoryContent.displayedName), directoryContent.isDirectory);
                    }
                    resolve();
                } else {
                    process.stdout.write("\x1b[1A");
                    process.stdout.write("\x1b[2K");
                    process.stdout.write(`Completed '${shortPath}' in ${(Date.now() - downloadStartDate) / 1000}s\n`);
                    fileCount++;
                    resolve();
                }
            });
        });
    });
})(downloadPath, savePath, downloadPath.endsWith("/") || null)
.then(() => console.log(`Downloaded ${fileCount} file${fileCount === 1 ? "" : "s"} in ${(Date.now() - startDate) / 1000}s`));