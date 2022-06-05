const express = require("express");
const route = express.Router();
const loadNetwork = require("../helpers/loadNetwork");
const { check, validationResult } = require("express-validator");
const listener = require("./../helpers/listener");

//Get All Orders
route.get("/get-all-orders", async (req, res) => {
  try {
    loadNetwork("meddrop", "order").then(async (contract) => {
      try {
        const result = await contract.evaluateTransaction("GetAllOrders");
        let data = JSON.parse(result.toString());
        data.map((e) =>
          e.Record.FeedBack
            ? (e.Record.FeedBack = JSON.parse(e.Record.FeedBack))
            : console.log("No feedBack")
        );
        return res.status(200).send(data);
      } catch (error) {
        console.log(`Failed to get all the orders: ${error}`);
        return res
          .status(404)
          .send(`Failed to get all the orders: ${error.message}`);
      }
    });
  } catch (error) {
    console.log(`Blockchain network error: ${error}`);
    return res
      .status(500)
      .json({ error: `Blockchain network error: ${error.message}` });
  }
});

//Query OrderById
route.get("/get-order-by-id/:order_id?", async (req, res) => {
  if (req.params.order_id == null || req.params.order_id.trim().length <= 0) {
    return res.status(400).json({ error: "OrderID is required!" });
  }
  try {
    loadNetwork("meddrop", "order").then(async (contract) => {
      try {
        const result = await contract.evaluateTransaction(
          "GetOrderById",
          req.params.order_id
        );
        console.log(`Order by ID has been retreived..`);
        let data = JSON.parse(result.toString());
        data.FeedBack
          ? (data.FeedBack = JSON.parse(data.FeedBack))
          : console.log("No feedBack");
        return res.status(200).send(data);
      } catch (error) {
        console.log(`Order Not Found!`);
        return res.status(404).send("Order Not Found");
      }
    });
  } catch (error) {
    console.log(`Blockchain network error: ${error}`);
    return res
      .status(500)
      .json({ error: `Blockchain network error: ${error.message}` });
  }
});

//Query Orders By CustomerID
route.get("/get-orders-by-customerId/:customer_id?", async (req, res) => {
  if (
    req.params.customer_id == null ||
    req.params.customer_id.trim().length <= 0
  ) {
    return res.status(400).json({ error: "CustomerID is required!" });
  }
  try {
    loadNetwork("meddrop", "order").then(async (contract) => {
      try {
        const result = await contract.evaluateTransaction(
          "GetOrdersByCustomerId",
          req.params.customer_id
        );
        console.log(`Orders by customerId have been retreived..`);
        let data = JSON.parse(result.toString());
        data.map((e) =>
          e.FeedBack
            ? (e.FeedBack = JSON.parse(e.FeedBack))
            : console.log("No feedBack")
        );
        return res.status(200).send(data);
      } catch (error) {
        console.log(`Failed to get orders by customerId: ${error}`);
        return res.status(404).send("Failed to get orders by customerId!");
      }
    });
  } catch (error) {
    console.log(`Blockchain network error: ${error}`);
    return res
      .status(500)
      .json({ error: `Blockchain network error: ${error.message}` });
  }
});

//Query Orders By Status
route.get("/get-orders-by-status/:status?", async (req, res) => {
  if (req.params.status == null || req.params.status.trim().length <= 0) {
    return res.status(400).json({ error: "Status is required!" });
  }
  try {
    loadNetwork("meddrop", "order").then(async (contract) => {
      try {
        const result = await contract.evaluateTransaction(
          "GetOrderByStatus",
          req.params.status
        );
        console.log(`Orders by status have been retreived..`);
        let data = JSON.parse(result.toString());
        data.map((e) =>
          e.FeedBack
            ? (e.FeedBack = JSON.parse(e.FeedBack))
            : console.log("No feedBack")
        );
        return res.status(200).send(data);
      } catch (error) {
        console.log(`Failed to get orders by status: ${error.message}`);
        return res
          .status(404)
          .json({ Error: "Failed to get orders by status!" });
      }
    });
  } catch (error) {
    console.log(`Blockchain network error: ${error}`);
    return res
      .status(500)
      .json({ error: `Blockchain network error: ${error.message}` });
  }
});

//Get Order History
route.get("/get-order-history/:order_id?", async (req, res) => {
  if (req.params.order_id == null || req.params.order_id.trim().length <= 0) {
    return res.status(400).json({ error: "OrderID is required!" });
  }
  try {
    loadNetwork("meddrop", "order").then(async (contract) => {
      try {
        const result = await contract.evaluateTransaction(
          "GetOrderHistory",
          req.params.order_id
        );
        let data = JSON.parse(result.toString());
        data.map((e) => {
          e.Record
            ? (e.Record = JSON.parse(e.Record))
            : console.log("No Record");
          e.Record.FeedBack
            ? (e.Record.FeedBack = JSON.parse(e.Record.FeedBack))
            : null;
        });
        console.log("Order history: ", data.length);

        return res.status(200).send(data);
      } catch (error) {
        console.log(`Order History Not Found: ${error.message}`);
        return res.status(400).json({
          error: `Order History Not Found: ${error.message}`,
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

//Place Order
route.post(
  "/place-order",
  [
    check("OrderID", "OrderID is required!").not().isEmpty(),
    check("ItemCount", "ItemCount is required!").not().isEmpty(),
    check("CustomerID", "CustomerID is required!").not().isEmpty(),
    check("Lat", "Lat is required!").not().isEmpty(),
    check("Long", "Long is required!").not().isEmpty(),
    check("DeliveryScheduleID", "DeliveryScheduleID is required!")
      .not()
      .isEmpty(),
    check("DeliveryCharges", "DeliveryCharges is required!").not().isEmpty(),
    check("DeliveryDateTime", "DeliveryDateTime is required!").not().isEmpty(),
    check("OrderPlaceDateTime", "OrderPlaceDateTime is required!")
      .not()
      .isEmpty(),
    check("GrossTotal", "GrossTotal is required!").not().isEmpty(),
    check("Discount", "Discount is required!").not().isEmpty(),
    check("VAT", "VAT is required!").not().isEmpty(),
    check("NetTotal", "NetTotal is required!").not().isEmpty(),
    check("StatusTitle", "StatusTitle is required!").not().isEmpty(),
    check("StatusTimeStamp", "StatusTimeStamp is required!").not().isEmpty(),
  ],
  async (req, res) => {
    console.log("Place Order Endpoint Hit!");

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      loadNetwork("meddrop", "order").then(async (contract) => {
        try {
          contract
            .submitTransaction(
              "PlaceOrder",
              req.body.OrderID,
              req.body.ItemCount,
              req.body.CustomerID,
              req.body.Lat,
              req.body.Long,
              req.body.DeliveryScheduleID,
              req.body.DeliveryCharges,
              req.body.DeliveryDateTime,
              req.body.OrderPlaceDateTime,
              req.body.GrossTotal,
              req.body.Discount,
              req.body.VAT,
              req.body.NetTotal,
              req.body.StatusTitle,
              req.body.StatusTimeStamp
            )
            .then(() => {
              contract.addContractListener(listener, "OrderPlaced").then(() => {
                // console.log("transactionId" + Id);
                console.log("Order has been placed!");
                console.log("TxnID: ", process.txId);
                return res.status(200).json({ transactionId: process.txId });
              });
            });
        } catch (error) {
          console.log(`Failed to place order: ${error}`);
          return res.status(400).json({
            error: `Failed to place order: ${error.message}`,
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

//Update Order Status
route.post(
  "/update-order-status",
  [
    check("OrderID", "OrderID is required!").not().isEmpty(),
    check("StatusTitle", "StatusTitle is required!").not().isEmpty(),
    check("StatusTimeStamp", "StatusTimeStamp is required!").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      loadNetwork("meddrop", "order").then(async (contract) => {
        try {
          contract
            .submitTransaction(
              "UpdateOrderStatus",
              req.body.OrderID,
              req.body.StatusTitle,
              req.body.StatusTimeStamp
            )
            .then(() => {
              contract
                .addContractListener(listener, "InvoiceUpdated")
                .then(() => {
                  // console.log("transactionId" + Id);
                  console.log("Order status has been updated!");
                  return res.status(200).json({ transactionId: process.txId });
                });
            });
        } catch (error) {
          console.log(`Failed to evaluate transaction: ${error}`);
          return res.status(400).json({
            error: `Failed to evaluate transaction: ${error.message}`,
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

//Update Order FeedBack
route.post(
  "/update-order-feedback",
  [
    check("OrderID", "OrderID is required!").not().isEmpty(),
    check("FeedBack", "FeedBack is required!").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const feedBack = JSON.stringify(req.body.FeedBack);
    try {
      loadNetwork("meddrop", "order").then(async (contract) => {
        try {
          contract
            .submitTransaction("PostOrderFeedBack", req.body.OrderID, feedBack)
            .then(() => {
              contract
                .addContractListener(listener, "FeedBackUpdated")
                .then(() => {
                  // console.log("transactionId" + Id);
                  console.log("Order FeedBack has been posted!");
                  return res.status(200).json({ transactionId: process.txId });
                });
            });
        } catch (error) {
          console.log(`Failed to post order feedback: ${error}`);
          return res.status(400).json({
            error: `Failed to post order feedback: ${error.message}`,
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

// Validate Order
route.get("/validate-order/:order_id?", async (req, res) => {
  if (req.params.order_id == null || req.params.order_id.trim().length <= 0) {
    return res.status(400).json({ error: "OrderID is required!" });
  }
  try {
    loadNetwork("meddrop", "order").then(async (contract) => {
      try {
        const result = await contract.evaluateTransaction(
          "GetOrderHistory",
          req.params.order_id
        );
        console.log(`Order validation data has been fetched!`);
        let data = JSON.parse(result.toString());
        data.map((e) => {
          e.Record
            ? (e.Record = JSON.parse(e.Record))
            : console.log("No Record");
          e.Record.FeedBack
            ? (e.Record.FeedBack = JSON.parse(e.Record.FeedBack))
            : null;
        });
        return res.status(200).send(data[data.length - 1].Record);
      } catch (error) {
        console.log(`Failed to get order validation data: ${error}`);
        return res.status(400).json({
          error: `Failed to get order validation data: ${error.message}`,
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

module.exports = route;
