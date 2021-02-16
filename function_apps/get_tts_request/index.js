// Author: Dharmender Goyal, Kaumodaki Innovations
// get_tts_request
//const settings = require("../shared/settings");
const createMongoClient = require('../shared/mongo');
const { ObjectID } = require('mongodb');

module.exports = async function (context, req) {
    var spostId = (req.query.postId || (req.body && req.body.postId));
    spostId = spostId ? spostId: "*";

    var filter = spostId == "*" ? { } : { "_id" : ObjectID(spostId)};
    context.log(filter);

    // Connect to MongoDB
    const { db, connection } = await createMongoClient()    

    const Posts = db.collection(process.env["tts_collection"])

    // find records
    const ttsPosts = await Posts.find(filter);
    const body = await ttsPosts.toArray();
    //console.log(body)
    context.res = {
        // status: 200, /* Defaults to 200 */
        body: { "posts" : body},
        headers: {
            'Content-Type': 'application/json'
            }
    };
}