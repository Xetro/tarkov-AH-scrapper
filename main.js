const wikiParser = require('./wiki-parser');
const categories = require("./wiki-categories.json");
const util = require('util');
const fs = require('fs');

const writeFile = (fileName, data) => util.promisify(fs.writeFile)(fileName, data);


const args = process.argv.slice(2);

const allCatergories = async () => {
    for (const [category, categoryData] of Object.entries(categories)) {
        let result = await wikiParser.getItemsFromCategory(category, categoryData);

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
}

const singleCategory = async (category) => {
    let categoryData = categories[category];
    if (!categoryData) {
        console.log(`Catergory named ${category} not found!`);
        return;
    }
    let result = await wikiParser.getItemsFromCategory(category, categoryData);

    if (result) {
        try {
            await writeFile(`./data/wiki/${category}-data.json`, JSON.stringify(result, null, 2));
            console.log('File writen');
        } catch (err) {
            console.log(err);
            throw err;
        }
    }
    return;
}

(async () => {
    if (args.length && args[0] === 'all') {
        allCatergories().catch(err => console.log('Error: ', err));
    } else if (args.length) {
        for (const category of args) {
            await singleCategory(category).catch(err => console.log('Error: ', err));
        }
    } else {
        console.log('Please provide arguments for categories you want to scrape or \'all\' for everything.');
    }
})();
