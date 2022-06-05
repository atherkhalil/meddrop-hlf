const express = require("express");
const route = express.Router();
const loadNetwork = require("../helpers/loadNetwork");
const { check, validationResult } = require("express-validator");
const listener = require("./../helpers/listener");

//Get All payment
route.get("/get-all-payments", async (req, res) => {
  try {
    loadNetwork("meddrop", "payment").then(async (contract) => {
      try {
        const result = await contract.evaluateTransaction("GetAllPayments");
        let data = JSON.parse(result.toString());
        return res.status(200).send(data);
      } catch (error) {
        console.log(`Failed to get all the payments: ${error}`);
        return res
          .status(404)
          .send(`Failed to get all the payments: ${error.message}`);
      }
    });
  } catch (error) {
    console.log(`Blockchain network error: ${error}`);
    return res
      .status(500)
      .json({ error: `Blockchain network error: ${error.message}` });
  }
});

//Get paymentById
route.get("/get-payment-by-id/:payment_id?", async (req, res) => {
  if (
    req.params.payment_id == null ||
    req.params.payment_id.trim().length <= 0
  ) {
    return res.status(400).json({ error: "payment ID is required!" });
  }
  try {
    loadNetwork("meddrop", "payment").then(async (contract) => {
      try {
        const result = await contract.evaluateTransaction(
          "GetPaymentById",
          req.params.payment_id
        );
        console.log(`payment by ID has been retreived..`);
        let data = JSON.parse(result.toString());
        return res.status(200).send(data);
      } catch (error) {
        console.log(`Failed to get payment by ID: ${error}`);
        return res.status(404).send("Failed to get payment by ID!");
      }
    });
  } catch (error) {
    console.log(`Blockchain network error: ${error}`);
    return res
      .status(500)
      .json({ error: `Blockchain network error: ${error.message}` });
  }
});

//Get payments By OrderID
route.get("/get-payments-by-order/:order_id?", async (req, res) => {
  if (req.params.order_id == null || req.params.order_id.trim().length <= 0) {
    return res.status(400).json({ error: "order_id is required!" });
  }
  try {
    loadNetwork("meddrop", "payment").then(async (contract) => {
      try {
        const result = await contract.evaluateTransaction(
          "GetPaymentsByOrderId",
          req.params.order_id
        );
        console.log(`payments by order_id have been retreived..`);
        let data = JSON.parse(result.toString());
        return res.status(200).send(data);
      } catch (error) {
        console.log(`Failed to get payments by order_id: ${error}`);
        return res.status(404).send("Failed to get payments by order_id!");
      }
    });
  } catch (error) {
    console.log(`Blockchain network error: ${error}`);
    return res
      .status(500)
      .json({ error: `Blockchain network error: ${error.message}` });
  }
});

//Get payment History
route.get("/get-payment-history/:payment_id?", async (req, res) => {
  if (
    req.params.payment_id == null ||
    req.params.payment_id.trim().length <= 0
  ) {
    return res.status(400).json({ error: "paymentID is required!" });
  }
  try {
    loadNetwork("meddrop", "payment").then(async (contract) => {
      try {
        const result = await contract.evaluateTransaction(
          "GetPaymentHistory",
          req.params.payment_id
        );
        let data = JSON.parse(result.toString());
        data.map((e) => {
          e.Record = JSON.parse(e.Record);
        });
        console.log("Payment history: ", data.length);

        return res.status(200).send(data);
      } catch (error) {
        console.log(`Failed to get payment history: ${error}`);
        return res.status(400).json({
          error: `Failed to get payment history: ${error.message}`,
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
  "/make-payment",
  [
    check("PaymentID", "PaymentID is required!").not().isEmpty(),
    check("OrderID", "OrderID is required!").not().isEmpty(),
    check("CustomerID", "CustomerID is required!").not().isEmpty(),
    check("NetTotal", "NetTotal is required!").not().isEmpty(),
    check("PaidAmt", "PaidAmt is required!").not().isEmpty(),
    check("TimeStamp", "TimeStamp is required!").not().isEmpty(),
  ],
  async (req, res) => {
    console.log("Mske payment Endpoint Hit!");

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      loadNetwork("meddrop", "payment").then(async (contract) => {
        try {
          contract
            .submitTransaction(
              "MakePayment",
              req.body.PaymentID,
              req.body.OrderID,
              req.body.CustomerID,
              req.body.NetTotal,
              req.body.PaidAmt,
              req.body.TimeStamp
            )
            .then(() => {
              contract.addContractListener(listener, "PaymentMade").then(() => {
                // console.log("transactionId" + Id);
                console.log("payment has been made!");
                return res.status(200).json({ transactionId: process.txId });
              });
            });
        } catch (error) {
          console.log(`Failed to make payment: ${error}`);
          return res.status(400).json({
            error: `Failed to make payment: ${error.message}`,
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
