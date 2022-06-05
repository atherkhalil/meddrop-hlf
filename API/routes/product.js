const express = require("express");
const route = express.Router();
const loadNetwork = require("../helpers/loadNetwork");
const { check, validationResult } = require("express-validator");
const listener = require("./../helpers/listener");

//Get All Products
route.get("/get-all-products", async (req, res) => {
  try {
    loadNetwork("meddrop", "product").then(async (contract) => {
      try {
        const result = await contract.evaluateTransaction("GetAllProducts");
        let data = JSON.parse(result.toString());
        return res.status(200).send(data);
      } catch (error) {
        console.log(`Failed to get all the products: ${error}`);
        return res
          .status(404)
          .send(`Failed to get all the products: ${error.message}`);
      }
    });
  } catch (error) {
    console.log(`Blockchain network error: ${error}`);
    return res
      .status(500)
      .json({ error: `Blockchain network error: ${error.message}` });
  }
});

//Get ProductById
route.get("/get-product-by-id/:product_id?", async (req, res) => {
  if (
    req.params.product_id == null ||
    req.params.product_id.trim().length <= 0
  ) {
    return res.status(400).json({ error: "Product ID is required!" });
  }
  try {
    loadNetwork("meddrop", "product").then(async (contract) => {
      try {
        const result = await contract.evaluateTransaction(
          "GetProductById",
          req.params.product_id
        );
        console.log(`Product by ID has been retreived..`);
        let data = JSON.parse(result.toString());
        return res.status(200).send(data);
      } catch (error) {
        console.log(`Failed to get Product by ID: ${error}`);
        return res.status(404).send("Failed to get Product by ID!");
      }
    });
  } catch (error) {
    console.log(`Blockchain network error: ${error}`);
    return res
      .status(500)
      .json({ error: `Blockchain network error: ${error.message}` });
  }
});

//Query Products By CustomerID
route.get("/get-product-by-title/:title?", async (req, res) => {
  if (req.params.title == null || req.params.title.trim().length <= 0) {
    return res.status(400).json({ error: "Product Title is required!" });
  }
  try {
    loadNetwork("meddrop", "product").then(async (contract) => {
      try {
        const result = await contract.evaluateTransaction(
          "GetProductByTitle",
          req.params.title
        );
        console.log(`Product by ProductTitle has been retreived..`);
        let data = JSON.parse(result.toString());
        return res.status(200).send(data);
      } catch (error) {
        console.log(`Failed to get product by title: ${error}`);
        return res.status(404).send("Failed to get product by title!");
      }
    });
  } catch (error) {
    console.log(`Blockchain network error: ${error}`);
    return res
      .status(500)
      .json({ error: `Blockchain network error: ${error.message}` });
  }
});

//Get Product History
route.get("/get-product-history/:product_id?", async (req, res) => {
  if (
    req.params.product_id == null ||
    req.params.product_id.trim().length <= 0
  ) {
    return res.status(400).json({ error: "ProductID is required!" });
  }
  try {
    loadNetwork("meddrop", "product").then(async (contract) => {
      try {
        const result = await contract.evaluateTransaction(
          "GetProductHistory",
          req.params.product_id
        );
        let data = JSON.parse(result.toString());
        data.map((e) => {
          e.Record = JSON.parse(e.Record);
        });
        console.log("Product history: ", data.length);

        return res.status(200).send(data);
      } catch (error) {
        console.log(`Failed to get product history: ${error}`);
        return res.status(400).json({
          error: `Failed to get product history: ${error.message}`,
        });
      }
    });
  } catch (error) {
    console.log(`Blockchain network error: ${error}`);
    return res
      .status(500)
      .json({ error: `Blockchain network error: ${error.message}` });
  }
});

//Place Product
route.post(
  "/add-product",
  [
    check("ProductID", "ProductID is required!").not().isEmpty(),
    check("ProductTitle", "ProductTitle is required!").not().isEmpty(),
    check("Unit", "Unit is required!").not().isEmpty(),
    check("Price", "Price is required!").not().isEmpty(),
    check("Supplier", "Supplier is required!").not().isEmpty(),
    check("Stock", "Stock is required!").not().isEmpty(),
    check("TemperatureConstraints", "TemperatureConstraints is required!")
      .not()
      .isEmpty(),
    check("Humidity", "Humidity is required!").not().isEmpty(),
    check("OtherLogisticalParameters", "OtherLogisticalParameters is required!")
      .not()
      .isEmpty(),
    check("TimeStamp", "TimeStamp is required!").not().isEmpty(),
  ],
  async (req, res) => {
    console.log("Add Product Endpoint Hit!");

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      loadNetwork("meddrop", "product").then(async (contract) => {
        try {
          contract
            .submitTransaction(
              "AddProduct",
              req.body.ProductID,
              req.body.ProductTitle,
              req.body.Unit,
              req.body.Price,
              req.body.TimeStamp,
              req.body.Supplier,
              req.body.Stock,
              req.body.TemperatureConstraints,
              req.body.Humidity,
              req.body.OtherLogisticalParameters
            )
            .then(() => {
              contract
                .addContractListener(listener, "ProductAdded")
                .then(() => {
                  // console.log("transactionId" + Id);
                  console.log("Product has been added!");
                  return res.status(200).json({ transactionId: process.txId });
                });
            });
        } catch (error) {
          console.log(`Failed to add product: ${error}`);
          return res.status(400).json({
            error: `Failed to add product: ${error.message}`,
          });
        }
      });
    } catch (error) {
      console.log(`Blockchain network error: ${error}`);
      return res
        .status(500)
        .json({ error: `Blockchain network error: ${error.message}` });
    }
  }
);

//Update Product Status
route.post(
  "/update-product",
  [
    check("ProductID", "ProductID is required!").not().isEmpty(),
    check("ProductTitle", "ProductTitle is required!").not().isEmpty(),
    check("Unit", "Unit is required!").not().isEmpty(),
    check("Price", "Price is required!").not().isEmpty(),
    check("Supplier", "Supplier is required!").not().isEmpty(),
    check("Stock", "Stock is required!").not().isEmpty(),
    check("TemperatureConstraints", "temperatureConstraints is required!")
      .not()
      .isEmpty(),
    check("Humidity", "humidity is required!").not().isEmpty(),
    check("OtherLogisticalParameters", "otherLogisticalParameters is required!")
      .not()
      .isEmpty(),
    check("UpdateTimeStamp", "UpdateTimeStamp is required!").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      loadNetwork("meddrop", "product").then(async (contract) => {
        try {
          contract
            .submitTransaction(
              "UpdateProduct",
              req.body.ProductID,
              req.body.ProductTitle,
              req.body.Unit,
              req.body.Price,
              req.body.Supplier,
              req.body.Stock,
              req.body.TemperatureConstraints,
              req.body.Humidity,
              req.body.OtherLogisticalParameters,
              req.body.UpdateTimeStamp
            )
            .then(() => {
              contract
                .addContractListener(listener, "ProductUpdated")
                .then(() => {
                  // console.log("transactionId" + Id);
                  console.log("Product has been updated!");
                  return res.status(200).json({ transactionId: process.txId });
                });
            });
        } catch (error) {
          console.log(`Failed to update Product: ${error}`);
          return res.status(400).json({
            error: `Failed to update Product: ${error.message}`,
          });
        }
      });
    } catch (error) {
      console.log(`Blockchain network error: ${error}`);
      return res
        .status(500)
        .json({ error: `Blockchain network error: ${error.message}` });
    }
  }
);

module.exports = route;
