const express = require('express');
const cors = require('cors');
const { ObjectId } = require('mongodb');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// mongodb connect this place 

const { MongoClient, ServerApiVersion, } = require('mongodb');

// const uri = "mongodb+srv://<db_username>:<db_password>@cluster0.hq6na.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hq6na.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const userCollection = client.db('TaskManagement').collection('users');
    const tasksCollection = client.db('TaskManagement').collection('tasks');



    // এখানে কোড লিখতে হবে। 
    app.post('/users', async (req, res) => {
      const user = req.body;

      const query = { email: user.email }
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ massage: 'user already exists', insertedId: null })
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    })

    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user) {
        res.send(user);
      } else {
        res.send({ message: 'User not found' });
      }
    });

    app.put('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const updatedUser = req.body;

      // _id ফিল্ড রিমুভ করুন যাতে MongoDB তে immutable field error না আসে
      delete updatedUser._id;

      const updateDoc = {
        $set: updatedUser
      };

      try {
        const result = await userCollection.updateOne(query, updateDoc, { upsert: true });

        if (result.modifiedCount > 0 || result.upsertedCount > 0) {
          const updatedData = await userCollection.findOne(query);
          res.send(updatedData);
        } else {
          res.send({ message: 'No changes made or User not found' });
        }
      } catch (error) {
        res.status(500).send({ message: 'Error updating user', error });
      }
    });

    // Create a new task
    app.post('/tasks', async (req, res) => {
      const task = req.body;
      task.timestamp = new Date();
      const result = await tasksCollection.insertOne(task);
      res.send(result);
    });

    // Get all tasks
    app.get('/tasks/:email', async (req, res) => {
      const email = req.params.email; // Get email from URL parameter
      const query = { email: email }; // Filter tasks by email
      const tasks = await tasksCollection.find(query).toArray(); // Find tasks for the specific user
      res.send(tasks); // Send the filtered tasks
    });
    // Update a task
    // app.put('/tasks/:id', async (req, res) => {
    //   const id = req.params.id;
    //   const updatedTask = req.body;
    //   const query = { _id: new ObjectId(id) }; // Use ObjectId here
    //   const result = await tasksCollection.updateOne(query, { $set: updatedTask });
    //   res.send(result);
    // });

    // Delete a task
    app.delete('/tasks/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }; // Use ObjectId here
      const result = await tasksCollection.deleteOne(query);
      res.send(result);
    });

    app.put('/tasks/:id', async (req, res) => {
      const id = req.params.id;
      const updatedTask = req.body;

      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: 'Invalid Task ID' });
      }

      // Ensure _id is not included in the update
      delete updatedTask._id;

      const query = { _id: new ObjectId(id) };
      const updateDoc = { $set: updatedTask };

      try {
        const result = await tasksCollection.updateOne(query, updateDoc);
        if (result.modifiedCount > 0) {
          const updatedData = await tasksCollection.findOne(query);
          res.send(updatedData);
        } else {
          res.status(404).send({ message: 'Task not found or no changes made' });
        }
      } catch (error) {
        res.status(500).send({ message: 'Error updating task', error });
      }
    });

    // Delete a task
    app.delete('/tasks/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }; // Use ObjectId here
      const result = await tasksCollection.deleteOne(query);
      res.send(result);
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('My server is running')
})

app.listen(port, () => {
  console.log(`My server is running on port:${port}`)
})

