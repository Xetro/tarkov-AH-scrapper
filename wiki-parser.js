const https = require("https");

const OPTIONS = {
  hostname: "escapefromtarkov.gamepedia.com",
  port: 443,
  method: "get"
};

const REQ_DELAY = 100;

const wikitextRegex = {
  0: /\!\s?\[\[(.*?)\]\]/g,
  1: /\s?\[\[(.*?)\]\]/g,
  2: /[!|\|]\[\[(.*?)\]\]/g,
  3: /\s?\[\[([F9].*?)\]\]/g
};

const getItemsFromCategory = async (categoryName, categoryData) => {
  let promiseArray = [];
  for (let [index, section] of categoryData.usePages.entries()) {
    const boundFunction = getItemNames.bind(null, categoryData, section, index);
    const nameRequest = withRetries(boundFunction);
    promiseArray.push(nameRequest);
  }

  console.log(`Getting item names for: ${categoryName}`);
  let results = await Promise.all(promiseArray);

  results = [].concat.apply([], results);

  if (categoryData.ignore.length) {
    results = results.filter((item) => !categoryData.ignore.includes(item[categoryData.nameIndex]));
  }

  promiseArray = [];
  for (let [index, item] of results.entries()) {
    const boundFunction = getItemPage.bind(null, item[categoryData.nameIndex], index)
    const pageRequest = withRetries(boundFunction);
    promiseArray.push(pageRequest);
  }

  console.log(`Getting item pages for: ${categoryName}`);
  const pages = await Promise.all(promiseArray);

  results = results.map((item, index) => {
    let name = item[categoryData.nameIndex];
    let image = item[categoryData.imgFileIndex].match(
      /File:(.+\.(png|gif|jpg|jpeg))/i
    );

    return {
      name,
      category: categoryName,
      image: image[1],
      title: pages[index].title,
      pageId: pages[index].pageId
    };
  });

  promiseArray = [];
  for (let [index, item] of results.entries()) {
    const boundFunction = getItemSize.bind(null, item.name, item.pageId, index);
    const sizeRequest = withRetries(boundFunction);
    promiseArray.push(sizeRequest);
  }

  console.log(`Getting item sizes for: ${categoryName}`);
  const sizes = await Promise.all(promiseArray);

  results = results.map((item, index) => {
    item.size = sizes[index];
    return item;
  });

  promiseArray = [];
  for (let [index, item] of results.entries()) {
    const boundFunction = getImageUrl.bind(null, item, index);
    const imageRequest = withRetries(boundFunction);
    promiseArray.push(imageRequest);
  }

  console.log(`Getting item images for: ${categoryName}`);
  const urls = await Promise.all(promiseArray);

  results = results.map((item, index) => {
    item.imagePath = urls[index];
    return item;
  });

  results = results.map(item => {
    item.filePath = item.name.split('\n').map(name => name.replace(/[^a-z0-9]/gi, '_').toLowerCase());
    item.filePath = item.filePath[0];
    return item;
  });

  const positionExceptions = Object.keys(categoryData.positionExceptions);
  const searchExceptions = Object.keys(categoryData.searchExceptions);

  results = results.map(item => {
    item.marketSearchName = item.title;
    if (searchExceptions.includes(item.name)) {
      item.marketSearchName = categoryData.searchExceptions[item.name];
    }

    item.marketPositionOffset = 0;
    if (positionExceptions.includes(item.name)) {
      item.marketPositionOffset = categoryData.positionExceptions[item.name];
    }

    return item;
  })

  return results;
};

const getItemNames = (category, section, index) => {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const response = [];
        const path = `/api.php?action=parse&page=${category.name}&prop=wikitext&format=json&section=${section}`;

        const data = await wikiAPIRequest(path);

        let wikiText = data.parse.wikitext["*"];

        if (category.additionalRegex) {
          const addRegex = new RegExp(category.additionalRegex, 'g');
          wikiText = wikiText.match(addRegex);
        }

        const regex = wikitextRegex[category.useRegex]
        
        let matches,
          output = [];

        while ((matches = regex.exec(wikiText))) {
          output.push(matches[1]);
        }

        let splice = 2;
        if (
          (category.name === "weapons" && (section === 1 || section === 9)) ||
          category.name === "chest_rigs"
        ) {
          splice = 3;
        }

        while (output.length) {
          response.push(output.splice(0, splice));
        }

        resolve(response);
      } catch (error) {
        console.log("ERROR getItemNames() request at item: ", category.name);
        reject(error);
      }
    }, REQ_DELAY * index);
  });
};

const getItemSize = (item, pageId, index) => {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const path = `/api.php?action=query&prop=revisions&rvprop=content&format=json&pageids=${pageId}`; //&rvsection=0 removed because errors sometimes
        const data = await wikiAPIRequest(path);
        const keys = Object.keys(data.query.pages);

        const infoboxText = data.query.pages[keys[0]].revisions[0]["*"];
        let regexp = infoboxText.match(/grid\s+=(\dx\d)/);

        if (!regexp) {
          regexp = infoboxText.match(/slot\s+=(\dx\d)/);
        }

        const size = {
          width: regexp[1].split("x")[0],
          height: regexp[1].split("x")[1]
        };

        resolve(size);
      } catch (error) {
        console.log("ERROR getItemSize() request at item: ", item);
        reject(error);
      }
    }, REQ_DELAY * index);
  });
};

const getItemPage = (item, index) => {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        let pageTitle = encodeURIComponent(item);
        switch (item) {
          case '6B5-16 Zh -86 "Uley" armored rig':
            pageTitle = '6B5-16';
            break;
          case '6B5-15 Zh -86 "Uley" armored rig':
            pageTitle = '6B5-15';
            break;   
          case 'A*B Arms MOD X mount for M700':
            pageTitle = encodeURIComponent('Arms MOD X mount for M700');
            break; 
          case 'A*B Arms MOD X Gen.3 keymod handguard for M700':
            pageTitle = encodeURIComponent('Arms MOD X Gen.3 keymod handguard for M700');
            break;     
          default:
            break;
        }
        const path = `/api.php?action=query&list=search&srlimit=1&srsearch=${pageTitle}&format=json`;

        const data = await wikiAPIRequest(path);
        const title = data.query.search[0].title;
        const pageId = data.query.search[0].pageid;

        resolve({ title, pageId });
      } catch (error) {
        console.log("ERROR getItemPage() request at item: ", item);
        reject(error);
      }
    }, REQ_DELAY * index);
  });
};

const getImageUrl = (item, index) => {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        let imageTitle;
        if (item.image !== "Molot_magazine_for_AK_and_compatibles%2C_75-round_capacity_icon.png") {
          imageTitle = encodeURIComponent(item.image);
        } else {
          imageTitle = item.image;
        }

        if (item.name === "Arbalet Patriot K+W mount") {
          console.log(imageTitle);
          console.log(item.image);
        }

        const path = `/api.php?action=query&prop=imageinfo&format=json&titles=File:${imageTitle}&iiprop=url`;
        const data = await wikiAPIRequest(path);

        const keys = Object.keys(data.query.pages);
        const url = data.query.pages[keys[0]].imageinfo[0].url;
        resolve(url);
      } catch (error) {
        console.log("ERROR getImageUrl() request at item: ", item);
        reject(error);
      }
    }, REQ_DELAY * index);
  });
};

const getBarters = async () => {
  const barterItemAndCount = /link=(.*?)\]\](.*?)?(x\d+)?(.*?)(?=\[\[)/gs;
  const singleBarter = /\|-(.*?)(?=\|-)/gs;
  const barterLevel = /LL(\d)/g;

  const path = `/api.php?action=parse&page=barter_trades&prop=wikitext&format=json`;
  const data = await wikiAPIRequest(path);

  let wikiText = data.parse.wikitext["*"];

  let barterMatches = wikiText.matchAll(singleBarter);
  let barters = []

  for (let barter of barterMatches) {
    let trades = {
      trader: "undefined",
      traderLoyalty: 1,
      trade: [],
      item: undefined
    }

    traderSet = false;
    let matches = barter[1].matchAll(barterItemAndCount)

    for (let match of matches) {
      if (
        match[1] === 'Prapor' || 
        match[1] === 'Therapist' || 
        match[1] === 'Skier' || 
        match[1] === 'Peacekeeper' || 
        match[1] === 'Ragman' || 
        match[1] === 'Jaeger' || 
        match[1] === 'Mechanic'
      ) {
        trades.trader = match[1];
        let lvl = Array.from(barter[1].matchAll(barterLevel), m => m[1]);
        trades.traderLoyalty = parseInt(lvl[0]);
        traderSet = true;
      } else if (!traderSet) {
        let quantity = match[3] ? parseInt(match[3].slice(1)) : 1;
        let item = {
          name: match[1],
          quantity
        }

        trades.trade.push(item);
      } else {
        trades.item = match[1];
        barters.push(trades);
      }
    }
  }
  return barters;
}

const wikiAPIRequest = path => {
  return new Promise((resolve, reject) => {
    const req = https.request({ ...OPTIONS, path }, res => {
      let body = "";

      res.on("data", data => {
        body += data;
      });

      res.on("end", () => {
        // console.log('end');
        const data = JSON.parse(body);
        resolve(data);
      });
    });

    req.on("error", err => {
      console.log(err);
      reject(err);
    });

    req.end();
  });
};

const withRetries = (request, retries=4, err=null) => {
  if (!retries) {
    return Promise.reject(err);
  }

  return request().catch(err => {
    console.log('retrying...', request);
    return withRetries(request, --retries, err);
  });
}

module.exports = {
  getItemsFromCategory,
  getBarters
};
