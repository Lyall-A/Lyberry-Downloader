function readDirectory(data) {
    const directoryHtml = data.toString();

    return Array.from(directoryHtml.matchAll(/<tr class="file">\n\s{6}<td><\/td>\n\s{6}<td>\n\s{7}<a href="(.*?)">\n\s{8}<svg .*?<\/svg>\n\s{8}<span class="name">(.*?)<\/span>\n\s{7}<\/a>\n\s{6}<\/td>\n\s{6}<td data-order="(.*?)">(.*?)<\/td>\n\s{6}<td class="hideable"><time datetime="(.*?)">(.*?)<\/time><\/td>\n\s{6}<td class="hideable"><\/td>\n\s{5}<\/tr>/g)).map(([match, name, displayedName, size, displayedSize, modifiedDate, displayedModifiedDate]) => ({
            name: name,
            displayedName: displayedName,
            size: size === "-1" ? null : parseInt(size),
            displayedSize: displayedSize,
            modifiedDate: new Date(modifiedDate),
            displayedModifiedDate: displayedModifiedDate,
            isDirectory: name.endsWith("/"),
        }
    ));
}

module.exports = readDirectory;