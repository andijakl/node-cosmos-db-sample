// Import the "express" module for more powerful web server capabilities.
const express = require('express');
// Import database node module
const CosmosClientInterface = require("@azure/cosmos").CosmosClient;
// Import the "querystring" module for one demo on how to prevent SQL injection attacks
const querystring = require('querystring');

// Initialize the express module and make it accessible via the app variable.
const app = express()

app.get('/', async (req, res) => {
    // Configure database access URI and primary key
    const endpoint = "https://<...>.documents.azure.com:443/";
    const authKey = "<...>";
    
    // Database and container IDs
    const databaseId = "ToDoList";
    const containerId = "Items";
    
    // Create new item in the database with a random ID
    const newItemId = Math.floor(Math.random() * 1000 + 10).toString();    
    let documentDefinition = {
        "id": newItemId,
        "name": "Angus MacGyver",
        "state": "Building stuff"
    };
    
    // Instantiate the cosmos client, based on the endpoint and authorization key
    const cosmosClient = new CosmosClientInterface({
        endpoint: endpoint,
        auth: {
            masterKey: authKey
        }
    });

    try {
        // Open a reference to the database
        const dbResponse = await cosmosClient.databases.createIfNotExists({
            id: databaseId
        });
        let database = dbResponse.database;
    
        // Retrieve container
        // Shorter variant: create variable container, which is in reality responsee.container.
        // Longer variant would be:
        // const coResponse = await ...
        // const container = coResponse.container;
        const { container } = await database.containers.createIfNotExists({id: containerId});

        // Add a new item to the container
        console.log("** Create item **");
        const createResponse = await container.items.create(documentDefinition);
        console.log(createResponse.body);
    
        // Execute SQL query to retrieve the new item
        console.log("** SQL query **");
        // Version with escaping the parameter
        //const queryResponse = await container.items.query("SELECT * FROM c WHERE c.id='" + querystring.escape(newItemId) + "'").toArray();
        // Version with parameterization
        const querySpec = {
            query: "SELECT * FROM c WHERE c.id=@id",
            parameters: [
                {
                    name: "@id",
                    value: newItemId
                }
            ]
        };
        const queryResponse = await container.items.query(querySpec).toArray();
        console.log(queryResponse.result[0].name);

        // Delete item
        console.log("** Delete item **");
        const deleteResponse = await container.item(newItemId).delete();
        console.log(deleteResponse.item.id);
        
        // Read all items from the container
        console.log("** All items **");
        const docResponse = await container.items.readAll().toArray();
        console.log(docResponse.result);

        res.send(docResponse);
    } catch (error) {
        console.log(error);
        res.status(500).send("Error with database query: " + error.body);
    }
  
});


// Start the server, listen at port 3000 (-> http://127.0.0.1:3000/)
// Also print a short info message to the console (visible in
// the terminal window where you started the node server).
app.listen(3000, () => console.log('Example app listening on port 3000!'))
