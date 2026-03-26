export type Paging = {
    currentPage: number,
	totalPage: number,
	totalElement: number,
	size: number,
	nextPage: boolean,
	previousPage: boolean,
	firstPage: boolean,
	lastPage: boolean
}

export interface Pagable<T> {
    data: Array<T>,
	unread?: number | undefined
    paging: Paging
}

export interface fillPaging {
	currentPage: number,
	totalPage: number,
	totalElement: number,
	size: number,
	nextPage: boolean,
	previousPage: boolean,
	firstPage: boolean,
	lastPage: boolean
}

export function buildPaging(
	page: number, 
	size: number, 
	totalData: number,
	totalPage: number
): fillPaging  {
	return {
		currentPage: page,
		totalPage: totalPage,
		totalElement: totalData,
		size: size,
		nextPage: page < totalPage,
		previousPage: page > 1,
		firstPage: page === 1,
		lastPage: page === totalPage
	}
}