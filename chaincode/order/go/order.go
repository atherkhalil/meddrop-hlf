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
	Record *Order
}

// Order Structure
type Order struct {
	DocType							string `json:"docType"`
	OrderID 						string `json:"OrderID"`
	ItemCount 					int `json:"ItemCount"`
	CustomerID 					string `json:"CustomerID"`
	Lat 								float64 `json:"Lat"`
	Long 								float64 `json:"Long"`
	DeliveryScheduleID 	string `json:"DeliveryScheduleID"`
	DeliveryCharges 		float64 `json:"DeliveryCharges"`
	DeliveryDateTime 		string `json:"DeliveryDateTime"`
	OrderPlaceDateTime 	string `json:"OrderPlaceDateTime"`
	GrossTotal 					float64 `json:"GrossTotal"`
	Discount 						float64 `json:"Discount"`
	VAT 								float64 `json:"VAT"`
	NetTotal 						float64 `json:"NetTotal"`
	StatusTitle 				string `json:"StatusTitle"`
	StatusTimeStamp 		string `json:"StatusTimeStamp"`
	FeedBack 						string `json:"FeedBack"`
}

// InitLedger checks the ledger for any error during deployment
func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) string {

	return "Order Chaincode Invoked!"
}

//SubmitOrder adds a new Order to the world state with given details
func (s *SmartContract) PlaceOrder(ctx contractapi.TransactionContextInterface, 
	OrderID string, 
	ItemCount int,
	CustomerID string,
	Lat float64,
	Long float64,
	DeliveryScheduleID string,
	DeliveryCharges float64,
	DeliveryDateTime string,
	OrderPlaceDateTime string,
	GrossTotal float64,
	Discount float64,
	VAT float64,
	NetTotal float64,
	StatusTitle string,
	StatusTimeStamp string) error {
		
	order := Order{
		DocType: "Order",
		OrderID: OrderID, 
		ItemCount: ItemCount,
		CustomerID: CustomerID,
		Lat: Lat,
		Long: Long,
		DeliveryScheduleID: DeliveryScheduleID,
		DeliveryCharges: DeliveryCharges,
		DeliveryDateTime: DeliveryDateTime,
		OrderPlaceDateTime: OrderPlaceDateTime,
		GrossTotal: GrossTotal,
		Discount: Discount,
		VAT: VAT,
		NetTotal: NetTotal,
		StatusTitle: StatusTitle,
		StatusTimeStamp: StatusTimeStamp}

	orderAsBytes, _ := json.Marshal(order)

	err := ctx.GetStub().PutState(OrderID, orderAsBytes)
	if err != nil {
		return fmt.Errorf("Error: Failed to place order! Reason: %s", err.Error())
	}
	ctx.GetStub().SetEvent("OrderPlaced", []byte(orderAsBytes))
	return nil
}

//GetAllOrders returns all Orders found in world state
func (s *SmartContract) GetAllOrders(ctx contractapi.TransactionContextInterface) ([]QueryResult, error) {

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

		order := new(Order)
		_ = json.Unmarshal(queryResponse.Value, order)

		queryResult := QueryResult{Key: queryResponse.Key, Record: order}
		results = append(results, queryResult)
	}

	return results, nil
}

// GetOrderById returns the order stored in the world state with given id
func (s *SmartContract) GetOrderById(ctx contractapi.TransactionContextInterface, OrderID string) (*Order, error) {

	queryString := fmt.Sprintf(`{"selector":{"docType":"Order","OrderID":"%s"}}`, OrderID)
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state. %s", err.Error())
	}
	defer resultsIterator.Close()

	result := []*Order{}
	result, err = constructQueryResponseFromIterator(resultsIterator)
	

	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state. %s", err.Error())
	}
	order := result[0]
	return order, nil
}

// GetOrdersByCustomerId returns all the orders stored in the world state by CustomerID
func (s *SmartContract) GetOrdersByCustomerId(ctx contractapi.TransactionContextInterface, CustomerID string) ([]*Order, error) {

	queryString := fmt.Sprintf(`{"selector":{"docType":"Order","CustomerID":"%s"}}`, CustomerID)
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)

	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state. %s", err.Error())
	}

	defer resultsIterator.Close()
	return constructQueryResponseFromIterator(resultsIterator)
}

// GetOrderByStatus returns all the orders stored in the world state by Status
func (s *SmartContract) GetOrderByStatus(ctx contractapi.TransactionContextInterface, StatusTitle string) ([]*Order, error) {

	queryString := fmt.Sprintf(`{"selector":{"docType":"Order","StatusTitle":"%s"}}`, StatusTitle)
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)

	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state. %s", err.Error())
	}

	defer resultsIterator.Close()
	return constructQueryResponseFromIterator(resultsIterator)
}

// constructQueryResponseFromIterator constructs a slice of assets from the resultsIterator
func constructQueryResponseFromIterator(resultsIterator shim.StateQueryIteratorInterface) ([]*Order, error) {
	var assets []*Order
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		var asset Order
		err = json.Unmarshal(queryResult.Value, &asset)
		if err != nil {
			return nil, err
		}
		assets = append(assets, &asset)
	}

	return assets, nil
}

//GetOrderHistory returns the history of orders stored in the world state with given id
func (s *SmartContract) GetOrderHistory(ctx contractapi.TransactionContextInterface, OrderID string) ([]QueryHistory, error) {

	history, err := ctx.GetStub().GetHistoryForKey(OrderID)

	if err != nil {
		return nil, fmt.Errorf("Failed to read History from world state. %s", err.Error())
	}

	if history == nil {
		return nil, fmt.Errorf("%s does not exist", OrderID)
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

// UpdateOrderStatus in world state
func (s *SmartContract) UpdateOrderStatus(ctx contractapi.TransactionContextInterface,
	OrderID string,  
	StatusTitle string, 
	StatusTimeStamp string) error {

		order, err := s.GetOrderById(ctx, OrderID)

		if err != nil {
			return err
		}
		
		order.StatusTitle = StatusTitle
		order.StatusTimeStamp = StatusTimeStamp

		orderAsBytes, _ := json.Marshal(order)

		err = ctx.GetStub().PutState(OrderID, orderAsBytes)
		if err != nil {
			return fmt.Errorf("Error: Failed to update order!")
		}

		ctx.GetStub().SetEvent("OrderUpdated", []byte(orderAsBytes))
		return nil
}

// Post FeedBack of Order
func (s *SmartContract) PostOrderFeedBack(ctx contractapi.TransactionContextInterface,
	OrderID string,
	FeedBack string) error {

		
		order, err := s.GetOrderById(ctx, OrderID)

		if err != nil {
			return err
		}
		order.FeedBack = FeedBack

		orderAsBytes, _ := json.Marshal(order)

		err = ctx.GetStub().PutState(OrderID, orderAsBytes)
		if err != nil {
			return fmt.Errorf("Error: Failed to update order feedback!")
		}

		ctx.GetStub().SetEvent("FeedBackUpdated", []byte(orderAsBytes))
		return nil
}

func main() {

	chaincode, err := contractapi.NewChaincode(new(SmartContract))

	if err != nil {
		fmt.Printf("Error creating Order chaincode: %s", err.Error())
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting Order chaincode: %s", err.Error())
	}
}
