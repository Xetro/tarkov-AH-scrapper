const { Pool } = require('pg');
const format = require('pg-format');
const fs = require('fs');
const path = require('path');

const readWikiData = () => {
  const wikiDataPath = path.resolve(__dirname, '../data/wiki');
  const fileNames = fs.readdirSync(wikiDataPath);
  let final = [];
  fileNames.forEach((filename) => {
    let data = fs.readFileSync(wikiDataPath + '/' + filename, 'utf-8');
    data = JSON.parse(data);
    final.push.apply(final, data);
  });
  return final;
}

const main = async () => {
  const wikiItems = await readWikiData();
  const pool = new Pool();

  let variables = wikiItems.map((item) => [
    item.name,
    item.category,
    item.image,
    parseInt(item.pageId),
    item.size.width * item.size.height,
    parseInt(item.size.height),
    parseInt(item.size.width),
    item.imagePath,
  ]);

  const query = format(`
    WITH insert ( name, "categoryName", "imageName", "wikiPageId", slots, "slotsHeight", "slotsWidth", "imageUrl" ) AS
    ( VALUES %L )  
    INSERT INTO items
      ( name, "categoryId", "imageName", "wikiPageId", slots, "slotsHeight", "slotsWidth", "imageUrl" ) 
    SELECT 
        insert.name, categories.id, insert."imageName", insert."wikiPageId"::int, insert.slots::int, insert."slotsHeight"::int, insert."slotsWidth"::int, insert."imageUrl"
    FROM 
      categories JOIN insert
        ON insert."categoryName" = categories.name ;
  `, variables)

  try {
    const res = await pool.query(query);
    console.log(res);
  } catch (err) {
    console.log(err.stack);
  }
}


(async () => {
  main();
})();

