import { Datastore } from "@google-cloud/datastore"

export const storeCurrentBlocknumber = async (network: string, blocknumber: number) => {
	const datastore = new Datastore();

	const taskKey = datastore.key('CurrentBlockNumber');

	const entity = {
		key: taskKey,
		data: [
			{
				name: 'network',
				value: network
			},
			{
				name: 'blocknumber',
				value: blocknumber
			},
			{
				name: 'created_at',
				value: new Date().toJSON()
			}
		]
	};

	await datastore.save(entity);
}
