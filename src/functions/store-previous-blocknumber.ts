import { Datastore } from "@google-cloud/datastore"

export const storePreviousBlocknumber = async (
	network: string, 
	blocknumber: number
): Promise<void> => {
	const datastore = new Datastore();

	const taskKey = datastore.key('PreviousBlockNumber');

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
