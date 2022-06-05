/*
SPDX-License-Identifier: Apache-2.0
*/

package main

import (
	"encoding/json"
	"fmt"
	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract provides functions for managing a workflow
type SmartContract struct {
	contractapi.Contract
}

// QueryHistory structure used for handling result of query
type QueryHistory struct {
	Record string
}

// QueryResult structure used for handling result of query
type QueryResult struct {
	Key    string `json:"Key"`
	Record *Route
}

// Route Structure
type Route struct {
	DocType					string `json:"docType"`
	RouteID 				string `json:"RouteID"`
	CustomerID      string `json:"CustomerID"`
	Departure 			string `json:"Departure"`
	Destination 		string `json:"Destination"`
	DataPoints 			string `json:"DataPoints"`
  ETA        			string `json:"ETA"`
	TimeStamp				string `json:"TimeStamp"`
	UpdateTimeStamp				string `json:"UpdateTimeStamp"`	
}

// InitLedger checks the ledger for any error during deployment
func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) string {

	return "Route Chaincode Invoked!"
}

//MakeRoute adds a new Route to the world state with given details
func (s *SmartContract) AddRoute(ctx contractapi.TransactionContextInterface, 
	RouteID string, 
	CustomerID string,
	Departure string,
	Destination string,
	DataPoints string,
	TimeStamp string,
	ETA string) error {
		
	route := Route{
		DocType: "Route",
		RouteID: RouteID, 
		CustomerID: CustomerID,
		Departure: Departure,
		Destination: Destination,
		DataPoints: DataPoints,
		ETA: ETA,
		TimeStamp: TimeStamp,
		UpdateTimeStamp: "none"}

	routeAsBytes, _ := json.Marshal(route)

	err := ctx.GetStub().PutState(RouteID, routeAsBytes)
	if err != nil {
		return fmt.Errorf("Error: Failed to Add Route! Reason: %s", err.Error())
	}
	ctx.GetStub().SetEvent("RouteAdded", []byte(routeAsBytes))
	return nil
}

//GetAllRoutes returns all Routes found in world state
func (s *SmartContract) GetAllRoutes(ctx contractapi.TransactionContextInterface) ([]QueryResult, error) {

	startKey := ""
	endKey := ""

	resultsIterator, err := ctx.GetStub().GetStateByRange(startKey, endKey)

	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	results := []QueryResult{}

	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()

		if err != nil {
			return nil, err
		}

		route := new(Route)
		_ = json.Unmarshal(queryResponse.Value, route)

		queryResult := QueryResult{Key: queryResponse.Key, Record: route}
		results = append(results, queryResult)
	}

	return results, nil
}

// GetRouteById returns the Route stored in the world state with given id
func (s *SmartContract) GetRouteById(ctx contractapi.TransactionContextInterface, RouteID string) (*Route, error) {

	queryString := fmt.Sprintf(`{"selector":{"docType":"Route","RouteID":"%s"}}`, RouteID)
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state. %s", err.Error())
	}
	defer resultsIterator.Close()

	result := []*Route{}
	result, err = constructQueryResponseFromIterator(resultsIterator)
	

	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state. %s", err.Error())
	}
	route := result[0]
	return route, nil
}

// GetRoutesByDestination returns all the Routes stored in the world state by Destination
func (s *SmartContract) GetRoutesByDestination(ctx contractapi.TransactionContextInterface, Destination string) ([]*Route, error) {

	queryString := fmt.Sprintf(`{"selector":{"docType":"Route","Destination":"%s"}}`, Destination)
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)

	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state. %s", err.Error())
	}

	defer resultsIterator.Close()
	return constructQueryResponseFromIterator(resultsIterator)
}


// constructQueryResponseFromIterator constructs a slice of assets from the resultsIterator
func constructQueryResponseFromIterator(resultsIterator shim.StateQueryIteratorInterface) ([]*Route, error) {
	var assets []*Route
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		var asset Route
		err = json.Unmarshal(queryResult.Value, &asset)
		if err != nil {
			return nil, err
		}
		assets = append(assets, &asset)
	}

	return assets, nil
}

//GetRouteHistory returns the history of Routes stored in the world state with given id
func (s *SmartContract) GetRouteHistory(ctx contractapi.TransactionContextInterface, RouteID string) ([]QueryHistory, error) {

	history, err := ctx.GetStub().GetHistoryForKey(RouteID)

	if err != nil {
		return nil, fmt.Errorf("Failed to read History from world state. %s", err.Error())
	}

	if history == nil {
		return nil, fmt.Errorf("%s does not exist", RouteID)
	}

	results := []QueryHistory{}

	for history.HasNext() {
		modification, err := history.Next()
		if err != nil {
			fmt.Println(err.Error())
			return nil, fmt.Errorf("Failed to read History from world state. %s", err.Error())
		}
		queryResult := QueryHistory{Record: string(modification.Value)}
		results = append(results, queryResult)
		fmt.Println("Returning information about", string(modification.Value))
	}

	return results, nil
}

// UpdateRoute in world state
func (s *SmartContract) UpdateRoute(ctx contractapi.TransactionContextInterface,
	RouteID string,
	Departure string,
	Destination string,
	DataPoints string,
	ETA string,
	UpdateTimeStamp string) error {

		route, err := s.GetRouteById(ctx, RouteID)

		if err != nil {
			return err
		}
		
		route.Departure = Departure
		route.Destination = Destination
		route.DataPoints = DataPoints
		route.ETA = ETA
		route.UpdateTimeStamp = UpdateTimeStamp

		routeAsBytes, _ := json.Marshal(route)

		err = ctx.GetStub().PutState(RouteID, routeAsBytes)
		if err != nil {
			return fmt.Errorf("Error: Failed to update route!")
		}

		ctx.GetStub().SetEvent("RouteUpdated", []byte(routeAsBytes))
		return nil
}

func main() {

	chaincode, err := contractapi.NewChaincode(new(SmartContract))

	if err != nil {
		fmt.Printf("Error creating Route chaincode: %s", err.Error())
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting Route chaincode: %s", err.Error())
	}
}
