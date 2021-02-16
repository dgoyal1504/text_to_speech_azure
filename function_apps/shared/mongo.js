const { MongoClient } = require("mongodb");
//const settings = require("../shared/settings");


async function createConnection() {
  const connection = await MongoClient.connect(process.env["tts_mongo_url"], {
    useNewUrlParser: true,
      retryWrites: false
  });
  const db = connection.db(process.env["tts_mongo_dbName"]);
  return {
    connection,
    db
  };
}

module.exports = createConnection;