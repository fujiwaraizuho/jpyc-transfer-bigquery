import { getCurrentBlocknumber } from "./functions/get-current-blocknumber"
import { storeCurrentBlocknumber } from "./functions/store-current-blocknumber";

export const exec = async () => {
	console.log(`CurrentBlockNumber: ${await getCurrentBlocknumber('polygon')}`);

	await storeCurrentBlocknumber('polygon', 500);

	console.log(`CurrentBlockNumber: ${await getCurrentBlocknumber('polygon')}`);
}
