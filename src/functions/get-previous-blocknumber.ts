import { Datastore } from "@google-cloud/datastore"

export const getPreviousBlocknumber = async (network: string): Promise<string> => {
	const datastore = new Datastore();

	const query = datastore.createQuery('PreviousBlockNumber')
		.filter('network', network)
		.order('created_at', {
			descending: true
		})
		.limit(1);

	const result = await datastore.runQuery(query);

	return result[0][0].blocknumber;
}
