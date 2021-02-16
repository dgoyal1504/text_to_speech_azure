// Author: Dharmender Goyal, Kaumodaki Innovations
const { ServiceBusClient } = require("@azure/service-bus");
//const settings = require("../shared/settings");
const createMongoClient = require('../shared/mongo');

module.exports = async function (context, req) {
    const sVoice = (req.query.voice || (req.body && req.body.voice));
    const sText = (req.query.text || (req.body && req.body.text));
    var newRecord = { text: sText, voice: sVoice, status:"PROCESSING"};
    //context.log("Voice, text: " + sVoice + ":" + sText)
    // Connect to MongoDB
    const { db, connection } = await createMongoClient()    
    const Posts = db.collection(process.env["tts_collection"])
    // Insert new record
    const newPost = await Posts.insertOne(newRecord);
    const recordId = newPost.insertedId;
    var response = "";
    // service bus
    // create a Service Bus client using the connection string to the Service Bus namespace
	const sbClient = new ServiceBusClient(process.env["tts_serviceBusConnectionString"]);

	// createSender() can also be used to create a sender for a topic.
	const sender = sbClient.createSender(process.env["tts_queue"]); 
	try {
		// Tries to send all messages in a single batch.
		// Will fail if the messages cannot fit in a batch.
		// await sender.sendMessages(messages);

		// create a batch object
		let batch = await sender.createMessageBatch(); 

        batch.tryAddMessage({ "body" : recordId});
        await sender.sendMessages(batch);        
        //context.log("closing sender");
		// Close the sender
		await sender.close();
        response = recordId;
	} catch (err) {
        response = recordId + " error"
    } finally {
		await sbClient.close();
	}    
    context.res = {
        // status: 200, /* Defaults to 200 */
        body: response
    };
}