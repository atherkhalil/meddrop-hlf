const express = require("express");
const route = express.Router();
const loadNetwork = require("../helpers/loadNetwork");
const { check, validationResult } = require("express-validator");
const listener = require("./../helpers/listener");

//Get All route
route.get("/get-all-routes", async (req, res) => {
  try {
    loadNetwork("meddrop", "route").then(async (contract) => {
      try {
        const result = await contract.evaluateTransaction("GetAllRoutes");
        let data = JSON.parse(result.toString());
        data.map((e) =>
          e.Record.DataPoints
            ? (e.Record.DataPoints = JSON.parse(e.Record.DataPoints))
            : console.log("No DataPoints")
        );
        return res.status(200).send(data);
      } catch (error) {
        console.log(`Failed to get all the routes: ${error}`);
        return res
          .status(404)
          .send(`Failed to get all the routes: ${error.message}`);
      }
    });
  } catch (error) {
    console.log(`Blockchain network error: ${error}`);
    return res
      .status(500)
      .json({ error: `Blockchain network error: ${error.message}` });
  }
});

//Get routeById
route.get("/get-route-by-id/:route_id?", async (req, res) => {
  if (req.params.route_id == null || req.params.route_id.trim().length <= 0) {
    return res.status(400).json({ error: "Route ID is required!" });
  }
  try {
    loadNetwork("meddrop", "route").then(async (contract) => {
      try {
        const result = await contract.evaluateTransaction(
          "GetRouteById",
          req.params.route_id
        );
        console.log(`Route by ID has been retreived..`);
        let data = JSON.parse(result.toString());
        console.log(data);
        data.DataPoints
          ? (data.DataPoints = JSON.parse(data.DataPoints))
          : console.log("No DataPoints");
        return res.status(200).send(data);
      } catch (error) {
        console.log(`Failed to get Route by ID: ${error}`);
        return res.status(404).send("Failed to get Route by ID!");
      }
    });
  } catch (error) {
    console.log(`Blockchain network error: ${error}`);
    return res
      .status(500)
      .json({ error: `Blockchain network error: ${error.message}` });
  }
});

//Get Route By Destination
route.get("/get-routes-by-destination/:destination?", async (req, res) => {
  if (
    req.params.destination == null ||
    req.params.destination.trim().length <= 0
  ) {
    return res.status(400).json({ error: "Destination is required!" });
  }
  try {
    loadNetwork("meddrop", "route").then(async (contract) => {
      try {
        const result = await contract.evaluateTransaction(
          "GetRoutesByDestination",
          req.params.destination
        );
        console.log(`routes by destination have been retreived..`);
        let data = JSON.parse(result.toString());

        data.map((e) =>
          e.DataPoints
            ? (e.DataPoints = JSON.parse(e.DataPoints))
            : console.log("No DataPoints")
        );
        return res.status(200).send(data);
      } catch (error) {
        console.log(`Failed to get routes by destination: ${error}`);
        return res.status(404).send("Failed to get routes by destination!");
      }
    });
  } catch (error) {
    console.log(`Blockchain network error: ${error}`);
    return res
      .status(500)
      .json({ error: `Blockchain network error: ${error.message}` });
  }
});

//Get route History
route.get("/get-route-history/:route_id?", async (req, res) => {
  if (req.params.route_id == null || req.params.route_id.trim().length <= 0) {
    return res.status(400).json({ error: "RouteID is required!" });
  }
  try {
    loadNetwork("meddrop", "route").then(async (contract) => {
      try {
        const result = await contract.evaluateTransaction(
          "GetRouteHistory",
          req.params.route_id
        );
        let data = JSON.parse(result.toString());
        data.map((e) => {
          e.Record = JSON.parse(e.Record);
        });
        data.map((e) =>
          e.Record.DataPoints
            ? (e.Record.DataPoints = JSON.parse(e.Record.DataPoints))
            : console.log("No DataPoints")
        );
        console.log("Route history: ", data.length);
        return res.status(200).send(data);
      } catch (error) {
        console.log(`Failed to get route history: ${error}`);
        return res.status(400).json({
          error: `Failed to get route history: ${error.message}`,
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

//Add Route
route.post(
  "/add-route",
  [
    check("RouteID", "routeID is required!").not().isEmpty(),
    check("CustomerID", "CustomerID is required!").not().isEmpty(),
    check("Departure", "routeTitle is required!").not().isEmpty(),
    check("Destination", "Unit is required!").not().isEmpty(),
    check("DataPoints", "Price is required!").not().isEmpty(),
    check("TimeStamp", "Supplier is required!").not().isEmpty(),
    check("ETA", "Stock is required!").not().isEmpty(),
  ],
  async (req, res) => {
    console.log("Add route Endpoint Hit!");

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(errors);
      return res.status(400).json({ errors: errors.array() });
    }
    const DataPoints = JSON.stringify(req.body.DataPoints);
    console.log("DataPoints", DataPoints);
    try {
      loadNetwork("meddrop", "route").then(async (contract) => {
        try {
          contract
            .submitTransaction(
              "AddRoute",
              req.body.RouteID,
              req.body.CustomerID,
              req.body.Departure,
              req.body.Destination,
              DataPoints,
              req.body.TimeStamp,
              req.body.ETA
            )
            .then(() => {
              contract.addContractListener(listener, "RouteAdded").then(() => {
                // console.log("transactionId" + Id);
                console.log("route has been added!");
                return res.status(200).json({ transactionId: process.txId });
              });
            });
        } catch (error) {
          console.log(`Failed to add route: ${error}`);
          return res.status(400).json({
            error: `Failed to add route: ${error.message}`,
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
  "/update-route",
  [
    check("RouteID", "routeID is required!").not().isEmpty(),
    check("Departure", "routeTitle is required!").not().isEmpty(),
    check("Destination", "Unit is required!").not().isEmpty(),
    check("DataPoints", "Price is required!").not().isEmpty(),
    check("ETA", "Stock is required!").not().isEmpty(),
    check("UpdateTimeStamp", "UpdateTimeStamp is required!").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const DataPoints = JSON.stringify(req.body.DataPoints);
    console.log("DataPoints", DataPoints);
    try {
      loadNetwork("meddrop", "route").then(async (contract) => {
        try {
          contract
            .submitTransaction(
              "UpdateRoute",
              req.body.RouteID,
              req.body.Departure,
              req.body.Destination,
              DataPoints,
              req.body.ETA,
              req.body.UpdateTimeStamp
            )
            .then(() => {
              contract
                .addContractListener(listener, "RouteUpdated")
                .then(() => {
                  // console.log("transactionId" + Id);
                  console.log("route has been updated!");
                  return res.status(200).json({ transactionId: process.txId });
                });
            });
        } catch (error) {
          console.log(`Failed to update route: ${error}`);
          return res.status(400).json({
            error: `Failed to update route: ${error.message}`,
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
