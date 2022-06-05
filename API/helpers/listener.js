const listener = (e) => {
  console.log("Event => ", e.eventName);
  const txnData = e.getTransactionEvent();
  console.log("Transaction Info => ", txnData);
  console.log("Payload => ", JSON.parse(e.payload.toString()));
  const txnId = txnData.transactionId;
  // console.log("Transaction ID: ", txnId);
  process.txId = txnId;
};

module.exports = listener;
