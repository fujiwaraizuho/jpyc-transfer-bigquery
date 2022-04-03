import { Contract, providers, utils } from "ethers";
import jpycTokenAbi from "../abis/jpycToken.json";
import { Transaction } from "../types/Transaction";

export const getPastTransferEvent = async (
	provider: providers.BaseProvider, 
	contract: Contract,
	fromBlock: number,
	toBlock: number
): Promise<Transaction[]> => {
	// fromBlock -> toBlock の間の Transfer Event を取得
	const rawLogs = await provider.getLogs({
		fromBlock: fromBlock,
		toBlock: toBlock,
		topics: [
			utils.id("Transfer(address,address,uint256)")
		],
		address: contract.address
	});

	const jpycTokenInterface = new utils.Interface(jpycTokenAbi);

	// 取得したログを整形
	const txs: Transaction[] = rawLogs.map(rawLog => {
		const data = jpycTokenInterface.decodeEventLog('Transfer', rawLog.data, rawLog.topics);

		return {
			txid: rawLog.transactionHash,
			block_number: rawLog.blockNumber,
			block_hash: rawLog.blockHash,
			nonce: rawLog.transactionIndex,
			from_address: data.from,
			to_address: data.to,
			value: utils.formatEther(data.value)
		};
	});

	// 重複している TX を除外する
	const parsedTxs = Array.from(
		new Map(txs.map(tx => [tx.txid, tx])).values()
	);

	return parsedTxs;
}
