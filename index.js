const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.88zvdrn.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const serviceCollection = client.db("Garir-Doctor").collection("services");
const bookingsCollection = client.db("Garir-Doctor").collection("bookings");
const productsCollection = client.db("Garir-Doctor").collection("products");
const cartCollection = client.db("Garir-Doctor").collection("cart");

const logger = async (req, res, next) => {
  console.log("called", req.host);
  next();
};

app.post("/jwt", logger, async (req, res) => {
  const user = req.body;
  // console.log(user);
  const token = jwt.sign(user, process.env.JWT_SECRET_KEY, {
    expiresIn: "1hr",
  });
  // console.log(token);
  res
    .cookie("token", token, {
      httpOnly: true,
      secure: false,
    })
    .send({ success: true });
});
app.post("/logout", async (req, res) => {
  const user = req.body;
  res.clearCookie("token", { maxAge: 0 }).send({ success: "true" });
});
const verifyToken = (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized access" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized access" });
  }
};

module.exports = verifyToken;

async function run() {
  try {
    await client.connect();

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/services", logger, async (req, res) => {
  try {
    const cursor = serviceCollection.find();
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});

app.get("/services/:id", logger, async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await serviceCollection.findOne(query);
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});

app.get("/bookings", verifyToken, async (req, res) => {
  // console.log("token", req.cookies);
  try {
    if (req.query.email !== req.user.email) {
      return res.status(403).send({ message: "UnAutherised" });
    }
    let query = {};
    if (req.query?.email) {
      query = { email: req.query.email };
    }
    const result = await bookingsCollection.find(query).toArray();
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});

app.post("/bookings", async (req, res) => {
  try {
    const data = req.body;
    const result = await bookingsCollection.insertOne(data);
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});
app.delete("/bookings/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await bookingsCollection.deleteOne(query);

    res.send(result);
  } catch (error) {
    console.log(error);
  }
});
app.patch("/bookings/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const data = req.body;
    const updateDoc = {
      $set: {
        state: data.state,
      },
    };
    const result = await bookingsCollection.updateOne(query, updateDoc);
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});

app.get("/products", async (req, res) => {
  try {
    const cursor = productsCollection.find();
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});
app.post("/cart", async (req, res) => {
  try {
    const data = req.body;
    console.log(data);
    const result = await cartCollection.insertOne(data);
    console.log(result);
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});
app.get("/cart", verifyToken, async (req, res) => {
  try {
    let query = {};
    if (req.query?.email) {
      query = { email: req.query.email };
    }
    const result = await cartCollection.find(query).toArray();
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});
app.get("/", (req, res) => {
  res.send("Garir Doctor server is running");
});

app.listen(port, () => {
  console.log(`Garir Doctor Server is running on port: ${port}`);
});
