const wikiParser = require('./wiki-parser');
const ocr = require('./ocr');
const categories = require("./wiki-categories.json");
const util = require('util');
const fs = require('fs');

const writeFile = (fileName, data) => util.promisify(fs.writeFile)(fileName, data);


let args = process.argv.slice(2);

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

const runOCR = async (category) => {
    if (!categories[category]) {
        console.log('Category not found: ', category);
        return;
    }
    const JSONwithPrices = await ocr.processImage(category);

    try {
        await writeFile(`./data/final/${category}-data.json`, JSON.stringify(JSONwithPrices, null, 2));
        console.log('File writen');
    } catch (error) {
        console.log(err);
        throw err;
    }
}

(async () => {
    if (args.length && args[0] === 'wiki') {
        args = args.slice(1);
        if (args.length && args[0] === 'all') {
            allCatergories().catch(err => console.log('Error: ', err));
        } else if (args.length) {
            for (const category of args) {
                await singleCategory(category).catch(err => console.log('Error: ', err));
            }
        } else {
            console.log('Please provide arguments for categories you want to scrape or \'all\' for everything.');
        }
    } else if (args.length && args[0] === 'ocr') {
        args = args.slice(1);
        let category = args[0];
        await runOCR(category).catch(err => console.log('Error: ', err));
    } else {
        console.log('Provide arguments for operation. \'wiki\' or \'ocr\'');
    }
})();