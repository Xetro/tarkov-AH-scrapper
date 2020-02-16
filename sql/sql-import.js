const { Pool } = require('pg');
const format = require('pg-format');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

const pool = new Pool();

const dataBackupPath = path.resolve(__dirname, '../data/backup');

const getItems = async () => {
  try {
    const { rows } = await pool.query('SELECT * FROM items');
    return rows;
  } catch (error) {
    console.log('getItems() ERROR: ', error);
    throw error;
  }
}

const readBackups = () => {
  const fileNames = fs.readdirSync(dataBackupPath);
  let final = [];
  fileNames.forEach((filename) => {
    let data = fs.readFileSync(dataBackupPath + '/' + filename, 'utf-8');
    data = JSON.parse(data);
    final.push(data);
  });
  return final;
}

const main = async () => {
  const itemsDb = await getItems();
  let itemsFinal = new Map();

  itemsDb.forEach(item => {
    itemsFinal.set(item.name, {
      id: item.id,
      prices: {}
    })
  });


  let backups = readBackups();

  backups.forEach((backup) => {
    backup.forEach((item) => {
      let name;
      switch (item.name) {
        case 'Gemech ONE 7.62x51 Sound Suppressor':
          name = 'Gemtech ONE 7.62x51 Sound Suppressor';
          break;
      
        case 'CAA AKTS AK-74 Buffer Tube for AK and compatable':
          name = 'CAA AKTS AK-74 Buffer Tube for AK and compatible';
          break;

        case 'Compact mount Mount for sights':
          name = 'Compact mount for sights';
          break;
    
        case 'Strike Industries Viper carabine length M-LOK foregrip for AR-15':
          name = 'Strike Industries Viper carbine length M-LOK foregrip for AR-15';
          break;

        case 'Muzzle brake Desert Tech 5.56x45':
          name = 'Desert Tech 5.56x45 FlashHider';
          break;
          
        default:
          name = item.name;
          break;
      }

      if (!itemsFinal.has(name)) {
        console.log('Missing item: ', name);
      } else {
        if (item.timestamp && item.price_avg) {
          let foo = itemsFinal.get(name);
          if (!foo.prices[item.timestamp]) {
            foo.prices[item.timestamp] = item.price_avg;
          }
        }
      }
    })
  });

  variables = [];
  itemsFinal.forEach((item) => {
    variables = variables.concat(Object.entries(item.prices).map(v => {
      let time = moment(v[0], 'YYYYMMDDHHmmss').format();
      v.splice(0, 2, item.id, v[1], time);
      return v;
    }));
  });

  const query = format(`
    INSERT INTO prices(
      "itemId", price, "timestamp")
      VALUES %L;
  `, variables);

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
