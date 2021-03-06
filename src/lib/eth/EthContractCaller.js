class EthContractCaller {
    constructor(web3, abi, contractAddress, fromAddr, fromPrivate, gasParams) {
        this.abi = abi;
        this.contractAddress = contractAddress;
        this.fromAddr = fromAddr;
        this.fromPrivate = fromPrivate;
        this.web3 = web3;
        this.gasParams = gasParams;
    }
    callView(methodName, methodArguments, callback) {
        let contract = new web3.eth.Contract(this.abi, this.contractAddress);

        let transfer = contract.methods[methodName]
            .apply(contract.methods[methodName], methodArguments)
            .call();

        transfer.then((value) => {
            callback('ok', value)
        }).catch((error) => {
            callback('error', error)
        })
    }

    async callViewAsync(methodName, methodArguments) {
        new Promise(then => {
            this.callView(methodName, methodArguments, (status, data) => {
                then(status, data);
            })
        })
    }


    call(methodName, methodArguments, callback) {
        let web3 = this.web3;
        let fromAddr = this.fromAddr;
        let fromPrivate = this.fromPrivate;
        let abiArray = this.abi;
        let contractAddress = this.contractAddress;
        let contract = new web3.eth.Contract(abiArray, contractAddress);

        let transfer = contract.methods[methodName].apply(contract.methods[methodName], methodArguments);
        let encodedABI = transfer.encodeABI();

        let tx = {
            from: fromAddr,
            to: contractAddress,

            gas: this.gasParams.gas,
            gasPrice: this.gasParams.gasPrice,

            data: encodedABI
        };

        web3.eth.accounts.signTransaction(tx, fromPrivate).then(signed => {
            var tran = web3.eth.sendSignedTransaction(signed.rawTransaction);
            let callbackCalled = false;
            tran.on('confirmation', (confirmationNumber, receipt) => {
                if (confirmationNumber > 4 && !callbackCalled) {
                    callbackCalled = true;
                    callback('ok', receipt);
                }
            });

            tran.on('transactionHash', hash => {
                callback('hash', hash);
            });

            tran.on('receipt', receipt => {
                callback('receipt', receipt);
            });

            tran.on('error', err => {
                callbackCalled = true;
                callback('error', err);
            });
        })
    }
}

module.exports = EthContractCaller;