const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();

const port = process.env.PORT || 8000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_PASS}@cluster0.dxzduzz.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    const usersCollection = client.db("schoolCamp").collection("users");
    const instructorCollection = client
      .db("schoolCamp")
      .collection("instructor");
    const classCollection = client.db("schoolCamp").collection("classes");
    const selectedClassCollection = client
      .db("schoolCamp")
      .collection("selectedClass");
    const enrolledClassCollection = client
      .db("schoolCamp")
      .collection("enrolledClass");

    // Save user email and role in DB

    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const query = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await usersCollection.updateOne(query, updateDoc, options);
      // console.log(result)
      res.send(result);
    });

    // get classes role in DB

    app.get("/getClasses", async (req, res) => {
      const result = await classCollection
        .find({ status: "approved" })
        .toArray();
      // console.log(result)
      res.send(result);
    });
    app.get("/instructorClasses", async (req, res) => {
      const result = await instructorCollection.find().toArray();
      // console.log(result)
      res.send(result);
    });

    // post classes role in DB
    app.post("/selectedClass", async (req, res) => {
      const body = req.body;
      body.createdAt = new Date();
      delete body._id;
      const exists = await selectedClassCollection.findOne({
        name: body.name,
        email: body.email,
      });
      if (!exists) {
        const result = await selectedClassCollection.insertOne(body);
        if (result?.insertedId) {
          return res.status(200).send(result);
        } else {
          return res.status(404).send({
            message: "can not insert try again leter",
            status: false,
          });
        }
      } else {
        res.status(404).send({
          message: "can't select the same class again",
          status: false,
        });
      }
    });

    // get user email and role in DB

    app.get("/user/:email", async (req, res) => {
      const { email } = req.params;
      // console.log(email);
      const result = await usersCollection.findOne({ email: email });
      // console.log(result);
      if (result.role === "student") {
        return res.status(200).send(true);
      } else if (result.role !== "student") {
        return res.status(200).send(false);
      } else {
        return res.status(404).send({
          message: "can not get try again later",
          status: false,
        });
      }
    });

    // checkInstructor email and role in DB

    app.get("/checkInstructor/:email", async (req, res) => {
      const { email } = req.params;
      // console.log(email);
      const result = await usersCollection.findOne({ email: email });
      // console.log(result);
      if (result.role === "instructor") {
        return res.status(200).send(true);
      } else if (result.role !== "instructor") {
        return res.status(200).send(false);
      } else {
        return res.status(404).send({
          message: "can not get try again later",
          status: false,
        });
      }
    });

    // checkAdmin email and role in DB

    app.get("/checkAdmin/:email", async (req, res) => {
      const { email } = req.params;
      // console.log(email);
      const result = await usersCollection.findOne({ email: email });
      // console.log(result);
      if (result.role === "admin") {
        return res.status(200).send(true);
      } else if (result.role !== "admin") {
        return res.status(200).send(false);
      } else {
        return res.status(404).send({
          message: "can not get try again later",
          status: false,
        });
      }
    });

    // checkUser email and role in DB

    app.get("/checkUser/:email", async (req, res) => {
      const { email } = req.params;
      // console.log(email);
      const result = await usersCollection.findOne({ email: email });
      // console.log(result);
      if (result) {
        return res.status(200).send(result);
      } else {
        return res.status(404).send({
          message: "can not get try again later",
          status: false,
        });
      }
    });

    // selected email and role in DB

    app.get("/selectedClass/:email", async (req, res) => {
      const { email } = req.params;
      const result = await selectedClassCollection
        .find({ email: email })
        .toArray();
      // console.log(result)
      res.send(result);
    });

    // delete with id and role in DB

    app.delete("/selectedClass/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await selectedClassCollection.deleteOne(query);
      res.send(result);
    });

    // payment method implement

    app.post("/payment", async (req, res) => {
      const id = req.body._id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const deleteClass = await selectedClassCollection.deleteOne(query);
      const update = await classCollection.updateOne(
        { name: req.body.name },
        { $inc: { availableSeats: -1, enrolledStudent: 1 } }
      );
      delete req.body._id;
      req.body.createdAt = new Date();
      const add = await enrolledClassCollection.insertOne(req.body);
      if (add?.insertedId) {
        return res.status(200).send(add);
      } else {
        return res.status(404).send({
          message: "can not enroll try again later",
          status: false,
        });
      }
    });

    // get enrolledClasses with email and role in DB

    app.get("/enrolledClasses/:email", async (req, res) => {
      const { email } = req.params;
      const result = await enrolledClassCollection
        .find({ email: email })
        .toArray();
      // console.log(result)
      res.send(result);
    });
    app.post("/addClass", async (req, res) => {
      const data = req.body;
      // console.log(data);
      const result = await classCollection.insertOne(data);
      res.send(result);
    });

    // get getClassForInstructor with email and role in DB

    app.get("/getClassForInstructor/:email", async (req, res) => {
      const { email } = req.params;
      const result = await classCollection
        .find({ instructorEmail: email })
        .toArray();
      res.send(result);
    });

    // get allClasses with email and role in DB

    app.get("/allClasses", async (req, res) => {
      const result = await classCollection.find().toArray();
      // console.log(result)
      res.send(result);
    });

 // put approvedClasses with id and role in DB

    app.put("/approveClass/:id", async (req, res) => {
      const id = req.params.id;
      const result = await classCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: "approved" } }
      );
      res.send(result);
    });

     // jpost deny with id and role in DB

    app.post("/deny/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id, req.body);
      const result = await classCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: "denied", feedback: req.body.feedback } }
      );
      res.send(result);
    });

     // getusers with  role in DB

    app.get("/getUsers", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

     // put make admin wjith id and role in DB

    app.put("/makeAdmin/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const result = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { role: "admin" } }
      );
      res.send(result);
    });

      // put make jinstructor wjith id and role in DB

    app.put("/makeInstructor/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const result = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { role: "instructor" } }
      );
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Summer camp Server is running");
});

app.listen(port, () => {
  console.log(`summer camp server is running on port: ${port}`);
});
