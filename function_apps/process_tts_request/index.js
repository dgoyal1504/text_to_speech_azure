// Author: Dharmender Goyal, Kaumodaki Innovations
// process_tts_request
const rp = require('request-promise');
const xmlbuilder = require('xmlbuilder');
const fetch = require('node-fetch');
//const settings = require("../shared/settings");
const createMongoClient = require('../shared/mongo');
const azure = require("azure-storage");
const { ObjectID } = require('mongodb');
module.exports = async function(context, mySbMsg) {
    //context.log('JavaScript ServiceBus queue trigger function processed message', mySbMsg);
    const postId = mySbMsg;
    var filter =  { "_id" : ObjectID(postId)};
    //context.log(filter);

    // Connect to MongoDB
    const { db, connection } = await createMongoClient()    //var mongoClient = require("mongodb").MongoClient;

    // Search post in DB 
    const Posts = db.collection(process.env["tts_collection"]) //tts-demo (CosmosDB)->tts-> posts[]
    const res = await Posts.find(filter)
    const body = await res.toArray()
    //context.log(body)
    const text = body[0]["text"]
    const voice = body[0]["voice"]
    //context.log("text is :", text)
    try {
        // Invoke Text to speech API
        const containerName = process.env["tts_audioContainer"];
        const blobName = postId + ".mp3";

        // Invoke Text to speech API
        // Get Access Token - Do we need to get it again and again?
        //context.log("getting access token:");
        //context.log(process.env["tts_issueTokenUri"], " : ", process.env["tts_cognitive_subscriptionKey"])
        const accessToken = await getAccessToken();
        //context.log("got access token:" + accessToken + " : " + containerName);
        const blobService = azure.createBlobService(process.env["tts_storageConnectionString"]);
        //context.log("Created blob service " + containerName);
        const writableStream = blobService.createWriteStreamToBlockBlob(
            containerName,
            blobName,
            {
              blockIdPrefix: "block",
              contentSettings: {
                contentType: "audio/mpeg",
              },
            },
        );
        //context.log("write stream created");        
        const data = await textToSpeech(accessToken, text, voice, writableStream)
        .finally(() => context.log("Promise ready"))
         .catch(err => context.log(err));
         
                     // callText to Speech
        //Generate Url
        //context.log("TTS done created");

        var sharedAccessPolicy = {
            AccessPolicy: {
              Permissions: azure.BlobUtilities.SharedAccessPermissions.READ,
              Start: Date(),
              Expiry: new Date(new Date().getTime() + process.env["tts_audioFileTTL"] * 1000)
            },
          };
          //context.log("shared access policy created, ttl is:" + process.env["tts_audioFileTTL"]*1000 + " blobName:" + blobName );
          //context.log("Container name is :" + containerName);
          var sasToken = blobService.generateSharedAccessSignature(containerName, blobName, sharedAccessPolicy);
          var sasUrl = blobService.getUrl(containerName, blobName, sasToken);
          //context.log("URI is", sasUrl);

        // Update URL and status field in the DB entry
        const posts = await Posts.findOneAndUpdate(
          filter,
          { 
            $set : { 
              "status": "UPDATED",
              "url" : sasUrl
            }
          }
        ) 
        connection.close()                          // Close DB connection          
    } catch (err) {
        context.log(`Something went wrong: ${err}`);
        context.log(err.stack);
    }
    //context.log("processing done");
};
// Gets an access token.
function getAccessToken() {
    //console.log(process.env["tts_issueTokenUri"], " : ", process.env["tts_cognitive_subscriptionKey"])
    let options = {
        method: 'POST',
        uri: process.env["tts_issueTokenUri"],
        headers: {
            'Ocp-Apim-Subscription-Key': process.env["tts_cognitive_subscriptionKey"]
        }
    }
    return rp(options);
}
// Converts text to speech using the input from readline.
function textToSpeech(accessToken, text, voice, writableStream) {
    return new Promise((resolve, reject) => {
        //console.log("Entering TTS");
      try {
        let xml_body = xmlbuilder
          .create("speak")
          .att("version", "1.0")
          .att("xml:lang", process.env["tts_language"])
          .ele("voice")
          .att("xml:lang", process.env["tts_language"])
          .att("name", voice)
          .txt(text)
          .end();
          //.att("name", process.env["tts_voiceName"])
        // Convert the XML into a string to send in the TTS request.
        let body = xml_body.toString();
        //console.log("XML created");
        let options = {
          method: "POST",
          baseUrl: process.env["tts_cognitiveUri"],
          url: "cognitiveservices/v1",
          headers: {
            Authorization: "Bearer " + accessToken,
            "cache-control": "no-cache",
            "User-Agent": "YOUR_RESOURCE_NAME",
            "X-Microsoft-OutputFormat": process.env["tts_audioFormat"],
            "Content-Type": "application/ssml+xml",
          },
          body: body,
        };
  
        rp(options)
          .pipe(writableStream)
          .on("finish", () => {
            resolve("done");
          });

      } catch (error) {
        reject(error);
      }
    });
  }