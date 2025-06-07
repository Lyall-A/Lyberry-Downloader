const fs = require("fs");

const header = fs.readFileSync("./header.html", "utf-8");

function checkIfDirectory(data) {
    return data.toString().includes(header);
}

module.exports = checkIfDirectory;