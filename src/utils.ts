// ref: https://qiita.com/yarnaimo/items/e92600237d65876f8dd8
export const chunkArray = <T extends any[]>(array: T, size: number) => {
	return array.reduce(
		(newArray, _, i) => (i % size ? newArray : [...newArray, array.slice(i, i + size)]),
		[] as T[][]
	);
}
