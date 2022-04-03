import { AlchemyProvider } from "@ethersproject/providers";
import { Contract } from "ethers";
import { getPastTransferEvent } from "../src/functions/get-past-transfer-events";
import { chunkArray } from "../src/utils";
import { insertTransferEvents } from "../src/functions/insert-transfer-events";

import jpycTokenAbi from '../src/abis/jpycToken.json';

/* CONFIG */
const network = 'polygon'

const alchemyNetworkName = 'matic';
const alchemyApiKey = '';

const jpycContractAddress = '0x6AE7Dfc73E0dDE2aa99ac063DcF7e8A63265108c';

/* ENTRY FUNCTION */
export const selfExec = async (previousBlockNumber: number, currentBlockNumber: number) => {
	console.info(`JPYC TransferEvent to BigQuery Batch [${network}]`);
	console.info('--- STEP1. Prepare BlockNumber ---');

	const provider = new AlchemyProvider(alchemyNetworkName, alchemyApiKey);

	// 前回処理した最終ブロック高を取得
	console.info(`-> Previous BlockNumber: ${previousBlockNumber}`);

	// 現在のブロック高を取得
	console.info(`-> Current BlockNumber: ${currentBlockNumber}`);

	// 今回の処理でターゲットにするブロック高を計算
	const targetBlockNumber = currentBlockNumber;
	console.info(`-> Target BlockNumber: ${targetBlockNumber}`);

	// 現在のブロック高が前回のブロック高と同じかそれより小さいときは処理しない
	if (previousBlockNumber >= targetBlockNumber) {
		console.info('-> Not enough difference.');
		console.info('-------------------------');
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
		console.info('-------------------------');
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

	console.info('-------------------------');
}

const _sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
	// 10000000 -> 2670000 を 20000block ごと取得
	const max = 26700000;

	let tmpCount = 0;

	for (let i = 10000000; i <= max; i += 20000) {
		await selfExec(tmpCount, i);

		tmpCount = i;

		await _sleep(10000);
	}
})();
