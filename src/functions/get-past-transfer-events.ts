import { Contract, providers, utils } from "ethers";
import jpycTokenAbi from "../../abis/jpycToken.json";

export const getPastTransferEvent = async (
	provider: providers.BaseProvider, 
	contract: Contract,
	fromBlock: number,
	toBlock: number
) => {
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
	const txs = rawLogs.map(rawLog => {
		const data = jpycTokenInterface.decodeEventLog('Transfer', rawLog.data, rawLog.topics);

		return {
			txid: rawLog.transactionHash,
			blockNumber: rawLog.blockNumber,
			blockHash: rawLog.blockHash,
			nonce: rawLog.transactionIndex,
			from: data.from,
			to: data.to,
			value: Number.parseInt(utils.formatEther(data.value))
		};
	});

	// 重複している TX を除外する
	const parsedTxs = Array.from(
		new Map(txs.map(tx => [tx.txid, tx])).values()
	);

	return parsedTxs;
}
