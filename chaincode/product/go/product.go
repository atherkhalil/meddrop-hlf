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
	Record *Product
}

// Product Structure
type Product struct {
	DocType										string  `json:"docType"`
	ProductID 								string  `json:"ProductID"`
	ProductTitle 							string `json:"ProductTitle"`
	Unit 											string  `json:"Unit"`
	Price 										float64 `json:"Price"`
  Supplier             			string  `json:"Supplier"`
  Stock              				int  `json:"Stock"`
	TemperatureConstraints 		string  `json:"TemperatureConstraints"`
	Humidity 					 				string  `json:"Humidity"`
	OtherLogisticalParameters string  `json:"OtherLogisticalParameters"`
	TimeStamp 								string `json:"TimeStamp"`
	UpdateTimeStamp 					string `json:"UpdateTimeStamp"`
}

// InitLedger checks the ledger for any error during deployment
func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) string {

	return "Product Chaincode Invoked!"
}

//MakeProduct adds a new Product to the world state with given details
func (s *SmartContract) AddProduct(ctx contractapi.TransactionContextInterface, 
	ProductID string, 
	ProductTitle string,
	Unit string,
	Price float64,
	TimeStamp string,
	Supplier string,
	Stock int,
	TemperatureConstraints string,
	Humidity string,
	OtherLogisticalParameters string) error {
		
	product := Product{
		DocType: "Product",
		ProductID: ProductID, 
		ProductTitle: ProductTitle,
		Unit: Unit,
		Price: Price,
		TimeStamp: TimeStamp,
		Supplier: Supplier,
		Stock: Stock,
		TemperatureConstraints: TemperatureConstraints,
		Humidity: Humidity,
		OtherLogisticalParameters: OtherLogisticalParameters,
		UpdateTimeStamp: "none"}

	productAsBytes, _ := json.Marshal(product)

	err := ctx.GetStub().PutState(ProductID, productAsBytes)
	if err != nil {
		return fmt.Errorf("Error: Failed to Add Product! Reason: %s", err.Error())
	}
	ctx.GetStub().SetEvent("ProductAdded", []byte(productAsBytes))
	return nil
}

//GetAllProducts returns all Products found in world state
func (s *SmartContract) GetAllProducts(ctx contractapi.TransactionContextInterface) ([]QueryResult, error) {

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

		product := new(Product)
		_ = json.Unmarshal(queryResponse.Value, product)

		queryResult := QueryResult{Key: queryResponse.Key, Record: product}
		results = append(results, queryResult)
	}

	return results, nil
}

// GetProductById returns the Product stored in the world state with given id
func (s *SmartContract) GetProductById(ctx contractapi.TransactionContextInterface, ProductID string) (*Product, error) {

	queryString := fmt.Sprintf(`{"selector":{"docType":"Product","ProductID":"%s"}}`, ProductID)
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state. %s", err.Error())
	}
	defer resultsIterator.Close()

	result := []*Product{}
	result, err = constructQueryResponseFromIterator(resultsIterator)
	

	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state. %s", err.Error())
	}
	Product := result[0]
	return Product, nil
}

// GetProductByTitle returns all the Products stored in the world state by ProductTitle
func (s *SmartContract) GetProductByTitle(ctx contractapi.TransactionContextInterface, ProductTitle string) ([]*Product, error) {

	queryString := fmt.Sprintf(`{"selector":{"docType":"Product","ProductTitle":"%s"}}`, ProductTitle)
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)

	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state. %s", err.Error())
	}

	defer resultsIterator.Close()
	return constructQueryResponseFromIterator(resultsIterator)
}


// constructQueryResponseFromIterator constructs a slice of assets from the resultsIterator
func constructQueryResponseFromIterator(resultsIterator shim.StateQueryIteratorInterface) ([]*Product, error) {
	var assets []*Product
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		var asset Product
		err = json.Unmarshal(queryResult.Value, &asset)
		if err != nil {
			return nil, err
		}
		assets = append(assets, &asset)
	}

	return assets, nil
}

//GetProductHistory returns the history of Products stored in the world state with given id
func (s *SmartContract) GetProductHistory(ctx contractapi.TransactionContextInterface, ProductID string) ([]QueryHistory, error) {

	history, err := ctx.GetStub().GetHistoryForKey(ProductID)

	if err != nil {
		return nil, fmt.Errorf("Failed to read History from world state. %s", err.Error())
	}

	if history == nil {
		return nil, fmt.Errorf("%s does not exist", ProductID)
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

// UpdateProduct in world state
func (s *SmartContract) UpdateProduct(ctx contractapi.TransactionContextInterface,
	ProductID string, 
	ProductTitle string,
	Unit string,
	Price float64,
	Supplier string,
	Stock int,
	TemperatureConstraints string,
	Humidity string,
	OtherLogisticalParameters string,
	UpdateTimeStamp string) error {

		product, err := s.GetProductById(ctx, ProductID)

		if err != nil {
			return err
		}
		
		product.ProductTitle = ProductTitle
		product.Unit = Unit
		product.Price = Price
		product.Supplier = Supplier
		product.Stock = Stock
		product.TemperatureConstraints = TemperatureConstraints
		product.Humidity = Humidity
		product.OtherLogisticalParameters = OtherLogisticalParameters
		product.UpdateTimeStamp = UpdateTimeStamp

		productAsBytes, _ := json.Marshal(product)

		err = ctx.GetStub().PutState(ProductID, productAsBytes)
		if err != nil {
			return fmt.Errorf("Error: Failed to update Product!")
		}

		ctx.GetStub().SetEvent("ProductUpdated", []byte(productAsBytes))
		return nil
}


func main() {

	chaincode, err := contractapi.NewChaincode(new(SmartContract))

	if err != nil {
		fmt.Printf("Error creating Product chaincode: %s", err.Error())
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting Product chaincode: %s", err.Error())
	}
}
