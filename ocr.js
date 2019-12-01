const OCR = require('tesseract.js-node');
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const readFile = (fileName) => util.promisify(fs.readFile)(fileName, 'utf-8');

const processImage = async (category) => {

  const worker = await OCR({
    tessdata: './',
    languages: ['bender']
  });

  let JSONData = await readFile(`./data/wiki/${category}-data.json`);
  JSONData = JSON.parse(JSONData);

  return Promise.all(
    JSONData.map(async (item) => {
      const rawImagePath = `./data/images/raw/${item.filePath}.png`;
      const processedImgPath = `./data/images/processed/${item.filePath}.png`;
      if (fs.existsSync(rawImagePath)) {
        await prepareImage(item.filePath);
        const text = worker.recognize(processedImgPath, 'bender');
        let price_array = text.replace(/[^\S\r\n]/g, '').split('\n');
        price_array.pop();
        price_array = price_array.map(price => price.slice(0, -1));
        item.price_array = price_array; 
      } else {
        console.log(`Image file for ${item.name} not found! Path: ${processedImgPath}`);
      }
      return item;
    })
  )
};

const prepareImage = async (filePath) => {
  try {
    const execString = `convert` + ' ' +
    `./data/images/raw/${filePath}.png` + ' ' +
    `-crop 186x1020+2920+140` + ' ' +
    `-set colorspace Gray -separate -average` + ' ' +
    `-threshold 50%` + ' ' +
    `-negate` + ' ' +
    `./data/images/processed/${filePath}.png`;

    const { stdout, stderr } = await exec(execString);
    if (stderr) {
      throw new Error(stderr);
    }
  } catch (error) {
    console.log('Error preparing image: ', error);
  }
}

module.exports = {
  processImage
};
