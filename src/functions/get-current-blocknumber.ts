import { Datastore } from "@google-cloud/datastore"

export const getCurrentBlocknumber = async (network: string): Promise<number> => {
	const datastore = new Datastore();

	const query = datastore.createQuery('CurrentBlockNumber')
		.filter('network', network)
		.order('created_at', {
			descending: true
		})
		.limit(1);

	const result = await datastore.runQuery(query);

	return result[0][0].blocknumber ?? 0;
}
