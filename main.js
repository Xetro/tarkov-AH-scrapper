const wikiParser = require('./wiki-parser');
const categories = require("./wiki-categories.json");
const util = require('util');
const fs = require('fs');

const writeFile = (fileName, data) => util.promisify(fs.writeFile)(fileName, data);

(async () => {
    for (const [category, data] of Object.entries(categories)) {
        let result = await wikiParser.getItemsFromCategory(category, data).catch(err => console.log('Error: ', err));

        if (result) {
            try {
                await writeFile(`./data/wiki/${category}-data.json`, JSON.stringify(result, null, 2));
                console.log('File writen');
            } catch (err) {
                console.log(err);
                throw err;
            }
        }
    }
})();
