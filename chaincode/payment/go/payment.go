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
	Record *Payment
}

// Payment Structure
type Payment struct {
	DocType							string `json:"docType"`
	PaymentID 						string `json:"PaymentID"`
	OrderID 						string `json:"OrderID"`
	CustomerID 					string `json:"CustomerID"`
	NetTotal 						float64 `json:"NetTotal"`
	PaidAmt							float64 `json:"PaidAmt"`
	TimeStamp 						string `json:"TimeStamp"`
}

// InitLedger checks the ledger for any error during deployment
func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) string {

	return "Payment Chaincode Invoked!"
}

//MakePayment adds a new Payment to the world state with given details
func (s *SmartContract) MakePayment(ctx contractapi.TransactionContextInterface, 
	PaymentID string, 
	OrderID string,
	CustomerID string,
	NetTotal float64,
	PaidAmt float64,
	TimeStamp string) error {
		
	payment := Payment{
		DocType: "Payment",
		PaymentID: PaymentID, 
		OrderID: OrderID,
		CustomerID: CustomerID,
		NetTotal: NetTotal,
		PaidAmt: PaidAmt,
		TimeStamp: TimeStamp}

	paymentAsBytes, _ := json.Marshal(payment)

	err := ctx.GetStub().PutState(PaymentID, paymentAsBytes)
	if err != nil {
		return fmt.Errorf("Error: Failed to Make Payment! Reason: %s", err.Error())
	}
	ctx.GetStub().SetEvent("PaymentMade", []byte(paymentAsBytes))
	return nil
}

//GetAllPayments returns all Payments found in world state
func (s *SmartContract) GetAllPayments(ctx contractapi.TransactionContextInterface) ([]QueryResult, error) {

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

		payment := new(Payment)
		_ = json.Unmarshal(queryResponse.Value, payment)

		queryResult := QueryResult{Key: queryResponse.Key, Record: payment}
		results = append(results, queryResult)
	}

	return results, nil
}

// GetPaymentById returns the Payment stored in the world state with given id
func (s *SmartContract) GetPaymentById(ctx contractapi.TransactionContextInterface, PaymentID string) (*Payment, error) {

	queryString := fmt.Sprintf(`{"selector":{"docType":"Payment","PaymentID":"%s"}}`, PaymentID)
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state. %s", err.Error())
	}
	defer resultsIterator.Close()

	result := []*Payment{}
	result, err = constructQueryResponseFromIterator(resultsIterator)
	

	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state. %s", err.Error())
	}
	payment := result[0]
	return payment, nil
}

// GetPaymentsByOrderId returns all the payments stored in the world state by CustomerID
func (s *SmartContract) GetPaymentsByOrderId(ctx contractapi.TransactionContextInterface, OrderID string) ([]*Payment, error) {

	queryString := fmt.Sprintf(`{"selector":{"docType":"Payment","OrderID":"%s"}}`, OrderID)
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)

	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state. %s", err.Error())
	}

	defer resultsIterator.Close()
	return constructQueryResponseFromIterator(resultsIterator)
}


// constructQueryResponseFromIterator constructs a slice of assets from the resultsIterator
func constructQueryResponseFromIterator(resultsIterator shim.StateQueryIteratorInterface) ([]*Payment, error) {
	var assets []*Payment
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		var asset Payment
		err = json.Unmarshal(queryResult.Value, &asset)
		if err != nil {
			return nil, err
		}
		assets = append(assets, &asset)
	}

	return assets, nil
}

//GetPaymentHistory returns the history of payments stored in the world state with given id
func (s *SmartContract) GetPaymentHistory(ctx contractapi.TransactionContextInterface, PaymentID string) ([]QueryHistory, error) {

	history, err := ctx.GetStub().GetHistoryForKey(PaymentID)

	if err != nil {
		return nil, fmt.Errorf("Failed to read History from world state. %s", err.Error())
	}

	if history == nil {
		return nil, fmt.Errorf("%s does not exist", PaymentID)
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


func main() {

	chaincode, err := contractapi.NewChaincode(new(SmartContract))

	if err != nil {
		fmt.Printf("Error creating Payment chaincode: %s", err.Error())
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting Payment chaincode: %s", err.Error())
	}
}
