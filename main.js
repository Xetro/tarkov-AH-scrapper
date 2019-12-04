const wikiParser = require('./wiki-parser');
const ocr = require('./ocr');
const categories = require("./wiki-categories.json");
const util = require('util');
const fs = require('fs');
const moment = require('moment');

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

    JSONwithPrices.map(item => {
        item.price_array.map((price, index) => {
            if (price[index + 1] && (price[index + 1].length < price.length )) {
                price = price.slice(0, -1);
            }
            return parseInt(price);
        })

        let price_avg;
        if (item.price_array.length > 3) {
            const sliced = item.price_array.slice(0, 3);
            const sum = sliced.reduce((acc, val) => acc + val, 0);
            price_avg = Math.floor(sum / sliced.length);
        } else {
            const sum = item.price_array.reduce((acc, val) => acc + val, 0);
            price_avg = Math.floor(sum / item.price_array.length);
        }

        const slots = item.size.width * item.size.height;
        const price_per_slot = Math.floor(price_avg / slots);

        return {
            ...item,
            slots,
            price_per_slot,
            price_avg,
        }
    })

    try {
        const timestamp = moment().format('YYYYMMDDHHmmss');
        await writeFile(`./data/final/${category}-data-${timestamp}.json`, JSON.stringify(JSONwithPrices, null, 2));
        console.log('File writen');
    } catch (error) {
        console.log(error);
        throw error;
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