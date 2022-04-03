import { BigQuery } from "@google-cloud/bigquery"
import { Transaction } from "../types/Transaction";

const datasetId = 'jpyc_event_archive';

const schema = [
	{ name: 'txid', type: 'STRING', mode: 'REQUIRED' },
	{ name: 'block_number', type: 'INTEGER', mode: 'REQUIRED' },
	{ name: 'block_hash', type: 'STRING', mode: 'REQUIRED' },
	{ name: 'nonce', type: 'INTEGER', mode: 'REQUIRED' },
	{ name: 'from_address', type: 'STRING', mode: 'REQUIRED' },
	{ name: 'to_address', type: 'STRING', mode: 'REQUIRED' },
	{ name: 'value', type: 'BIGNUMERIC', mode: 'REQUIRED' },
];

export const insertTransferEvents = async (
	network: string, 
	txs: Transaction[]
): Promise<void> => {
	const tableId = `${network}_transfer_event`;

	const bigquery = new BigQuery();

	// テーブルの存在確認 & なければ作成
	const [isTableExists] = await bigquery.dataset(datasetId)
		.table(tableId)
		.exists();

	if (!isTableExists) {
		await bigquery.dataset(datasetId)
			.createTable(tableId, {
				schema: schema
			});
	}

	// テーブルにデータをストリーミング挿入
	await bigquery.dataset(datasetId)
		.table(tableId)
		.insert(txs);
}
