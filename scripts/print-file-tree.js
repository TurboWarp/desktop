const pathUtil = require('path');
const fs = require('fs');
const nodeCrypto = require('crypto');

const recursivelyPrint = (directory) => {
    const dirStat = fs.statSync(directory);
    console.log(pathUtil.join(directory, '/'));
    console.log(`\tCreated: ${dirStat.birthtime.toUTCString()}`);
    console.log(`\tModified: ${dirStat.mtime.toUTCString()}`);
    console.log(`\tAccessed: ${dirStat.atime.toUTCString()}`);

    const children = fs.readdirSync(directory);
    for (const child of children) {
        const path = pathUtil.join(directory, child);
        const childStat = fs.statSync(path);
        if (childStat.isFile()) {
            console.log(path);
            const data = fs.readFileSync(path);
            const sha256 = nodeCrypto
                .createHash('sha256')
                .update(data)
                .digest('hex');
            console.log(`\tSHA-256: ${sha256}`);
            console.log(`\tCreated: ${childStat.birthtime.toUTCString()}`);
            console.log(`\tModified: ${childStat.mtime.toUTCString()}`);
            console.log(`\tAccessed: ${childStat.atime.toUTCString()}`);
        } else {
            recursivelyPrint(path);
        }
    }
};

for (let i = 2; i < process.argv.length; i++) {
    recursivelyPrint(process.argv[i]);
}
