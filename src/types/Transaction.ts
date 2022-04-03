export type Transaction = {
	txid: string,
	block_number: number,
	block_hash: string,
	nonce: number,
	from_address: string,
	to_address: string,
	value: string
};
