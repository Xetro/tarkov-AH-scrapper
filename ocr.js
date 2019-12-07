const OCR = require('tesseract.js-node');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

let worker;

const initOCR = async () => {
  worker = await OCR({
    tessdata: './',
    languages: ['bender']
  });
  return;
}

const processImage = async (fileName, filePath) => {

  console.log('Starting image processing...');


  const processedImgPath = `./data/images/processed/${fileName}.png`;

  await prepareImage(processedImgPath, filePath);

  console.log(`Reading image characters...`);
  const text = worker.recognize(processedImgPath, 'bender');
  if (fileName === 'silencerco_salvo_12_sound_suppressor') {
    console.log('TEXT: ', text);
  }
  let price_array = text.replace(/[^\S\r\n]/g, '').split('\n').filter(string => string.length);

  price_array = price_array.map(price => price.slice(0, -1));
  return price_array;
};

const prepareImage = async (processedImgPath, filePath) => {
  console.log(`Preparing image for OCR: ${filePath}`);
  try {
    const execString = `convert` + ' ' +
    filePath + ' ' +
    `-crop 186x1020+2920+140` + ' ' +
    `-set colorspace Gray -separate -average` + ' ' +
    `-threshold 50%` + ' ' +
    `-negate` + ' ' +
    processedImgPath;

    const { stdout, stderr } = await exec(execString);
    if (stderr) {
      throw new Error(stderr);
    }
  } catch (error) {
    console.log('Error preparing image: ', error);
  }
}

module.exports = {
  processImage,
  initOCR
};
