const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

const port = process.env.PORT || 3000;

const app = express();

//middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
    optionSuccessStatus: 200,
  })
);

app.use(express.json());

const uri =
  "mongodb+srv://Findo:vlR7uueTXd21aNqG@cluster0.x7zkge4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
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
    const productCollection = client.db("FindoDB").collection("products");

    //count products
    app.get("/count-products", async (req, res) => {
      const result = await productCollection.find().toArray();
      res.send({ length: result?.length });
    });

    app.get("/products", async (req, res) => {
      const {
        search,
        sort,
        page,
        size,
        brands,
        categories,
        minPrice,
        maxPrice,
        filter,
      } = req.query;

      let filterByBrands = {};
      if (brands) {
        filterByBrands = {
          brand: { $in: brands },
        };
      }

      let filterByCategories = {};
      if (categories) {
        filterByCategories = {
          category: { $in: categories },
        };
      }

      let filterQuery = {};
      if(brands || categories){
        filterQuery = {
            ...(brands? {brand: {$in: brands}} : {}),
            ...(categories? {category: {$in: categories}}: {})
        }
      }

      let priceFilter = {};
      if (parseInt(minPrice)) {
        priceFilter.price = { $gte: parseInt(minPrice) };
      }
      if (parseInt(maxPrice)) {
        priceFilter.price = { ...priceFilter.price, $lte: parseInt(maxPrice) };
      }

      let query = {};
      if (search) {
        query = { productName: { $regex: search, $options: "i" } };
      }

      let sortOptions = {};
      if (sort === "priceAsc") {
        sortOptions = { price: 1 };
      } else if (sort === "priceDsc") {
        sortOptions = { price: -1 };
      } else if (sort === "newest") {
        sortOptions = { createdAt: -1 };
      }

      try {
        const result = await productCollection
          .find({
            ...query,
            ...filterQuery,
            ...priceFilter,
          })
          .sort(sortOptions)
          .skip((parseInt(page) - 1) * parseInt(size))
          .limit(parseInt(size))
          .toArray();
        res.send(result);
      } catch (error) {
        console.log("error from catch:", error.message);
      }
    });

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
  res.send("Server is running");
});
app.listen(port, () => {
  console.log("server is running on port:", port);
});
