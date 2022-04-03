import { AlchemyProvider } from "@ethersproject/providers";
import { Contract } from "ethers";
import { getPastTransferEvent } from "./functions/get-past-transfer-events";
import { getPreviousBlocknumber } from "./functions/get-previous-blocknumber";
import { chunkArray } from "./utils";
import { insertTransferEvents } from "./functions/insert-transfer-events";
import { storePreviousBlocknumber } from "./functions/store-previous-blocknumber";

import jpycTokenAbi from './abis/jpycToken.json';

/* CONFIG */
const network = process.env.NETWORK_NAME;

const alchemyNetworkName = process.env.ALCHEMY_NETWORK_NAME;
const alchemyApiKey = process.env.ALCHEMY_API_KEY;

const jpycContractAddress = process.env.JPYC_CONTRACT_ADDRESS;

const confirmation = Number.parseInt(process.env.CONFIRMATION);

/* ENTRY FUNCTION */
export const exec = async (): Promise<void> => {
	console.info(`JPYC TransferEvent to BigQuery Batch [${network}]`);
	console.info('--- STEP1. Prepare BlockNumber ---');

	const provider = new AlchemyProvider(alchemyNetworkName, alchemyApiKey);

	// 前回処理した最終ブロック高を取得
	const previousBlockNumber = Number.parseInt(await getPreviousBlocknumber(network));
	console.info(`-> Previous BlockNumber: ${previousBlockNumber}`);

	// 現在のブロック高を取得
	const currentBlockNumber = await provider.getBlockNumber();
	console.info(`-> Current BlockNumber: ${currentBlockNumber}`);

	// 今回の処理でターゲットにするブロック高を計算
	const targetBlockNumber = currentBlockNumber - confirmation;
	console.info(`-> Target BlockNumber: ${targetBlockNumber}`);

	// 現在のブロック高が前回のブロック高と同じかそれより小さいときは処理しない
	if (previousBlockNumber >= targetBlockNumber) {
		console.info('-> Not enough difference.');
		await storePreviousBlocknumber(network, targetBlockNumber);
		console.info('-> Stored TargetBlockNumber');
		return;
	}

	console.info(`-> Difference Block Number: ${targetBlockNumber - previousBlockNumber}`);

	console.info('--- STEP2. Get Transfer Event ---');

	const jpycTokenContract = new Contract(jpycContractAddress, jpycTokenAbi, provider);

	// 最終処理ブロック高と現在のブロック高の間の TransferEvent を取得
	const txs = await getPastTransferEvent(provider, jpycTokenContract, previousBlockNumber + 1, targetBlockNumber);

	console.info(`-> TransferEvent TXS Length: ${txs.length}`);

	// 該当トランザクションが存在しなかったら処理しない
	if (txs.length <= 0) {
		console.info('-> Not enough transactions.');
		await storePreviousBlocknumber(network, targetBlockNumber);
		console.info('-> Stored TargetBlockNumber');
		return;
	}

	// 取得したイベントが 100 件以上の配列になった場合は分割する
	const chunkedTxs = chunkArray(txs, 100);

	console.info(`-> Chunked TXS Length: ${chunkedTxs.length}`);

	console.info('--- STEP3. Store BigQuery ---');

	let counter = 0;

	for (const chunkdTx of chunkedTxs) {
		counter += chunkdTx.length;
		console.info(`-> Processing... [${counter}/${txs.length}]`);

		await insertTransferEvents(network, chunkdTx);

		console.info(`-> Processed Transaction [${counter}/${txs.length}]`);
	}

	console.info('--- STEP4. Store CurrentBlockNumber ---');

	await storePreviousBlocknumber(network, targetBlockNumber);
	
	console.info('-> Stored TargetBlockNumber.');
	console.info('-------------------------');
}
