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
    paging: Paging
}