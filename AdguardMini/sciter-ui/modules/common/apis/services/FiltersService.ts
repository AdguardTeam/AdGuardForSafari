/* This code was generated automatically by proto-parser tool version 1 */


import { EmptyValue, Filters, FiltersEnabledIds, Path, FilterOrError, CustomFilterToAdd, OptionalError, CustomFiltersToDelete, FiltersUpdate, FiltersIndex, CustomFilterUpdateRequest, FiltersGroupedByExtensions, BoolValue } from '../types'
import { xcall } from 'ApiWindow';

/* Service handles about app information  */
interface IFiltersService {
	/* Get Filters app info */
	GetFiltersMetadata(param:EmptyValue): Promise<Filters>;
	/* Get ids of enabled filters */
	GetEnabledFiltersIds(param:EmptyValue): Promise<FiltersEnabledIds>;
	/* Check Custom Filter */
	CheckCustomFilter(param:Path): Promise<FilterOrError>;
	/* Confirm add Custom filter */
	ConfirmAddCustomFilter(param:CustomFilterToAdd): Promise<OptionalError>;
	/* Delete custom filters */
	DeleteCustomFilters(param:CustomFiltersToDelete): Promise<OptionalError>;
	/* Update filters settings */
	UpdateFilters(param:FiltersUpdate): Promise<OptionalError>;
	/* Get filters index */
	GetFiltersIndex(param:EmptyValue): Promise<FiltersIndex>;
	/* Update custom filter */
	UpdateCustomFilter(param:CustomFilterUpdateRequest): Promise<OptionalError>;
	/* Request update on filter library, result will be dispatch by
	 * TrayCallbackService.OnFilterStatusResolved */
	RequestFiltersUpdate(param:EmptyValue): Promise<EmptyValue>;
	/* Request filters divided by safari extension */
	GetFiltersGroupedByExtensions(param:EmptyValue): Promise<FiltersGroupedByExtensions>;
	/* Update language specific */
	UpdateLanguageSpecific(param:BoolValue): Promise<EmptyValue>;
}

/**
 * Service handles about app information
 */
export class FiltersService implements IFiltersService {
	/**
	 * Get Filters app info
	 * @param EmptyValue param
	 * @returns Filters param
	 */
	GetFiltersMetadata = async (param: EmptyValue): Promise<Filters> => {
		log.dbg('Request data', 'FiltersService.GetFiltersMetadata', param.toObject());

		const res = await xcall('FiltersService.GetFiltersMetadata', param.serializeBinary().buffer);
		const data = Filters.deserializeBinary(res);

		log.dbg('Response data', 'FiltersService.GetFiltersMetadata', data.toObject());
		return data;
	};

	/**
	 * Get ids of enabled filters
	 * @param EmptyValue param
	 * @returns FiltersEnabledIds param
	 */
	GetEnabledFiltersIds = async (param: EmptyValue): Promise<FiltersEnabledIds> => {
		log.dbg('Request data', 'FiltersService.GetEnabledFiltersIds', param.toObject());

		const res = await xcall('FiltersService.GetEnabledFiltersIds', param.serializeBinary().buffer);
		const data = FiltersEnabledIds.deserializeBinary(res);

		log.dbg('Response data', 'FiltersService.GetEnabledFiltersIds', data.toObject());
		return data;
	};

	/**
	 * Check Custom Filter
	 * @param Path param
	 * @returns FilterOrError param
	 */
	CheckCustomFilter = async (param: Path): Promise<FilterOrError> => {
		log.dbg('Request data', 'FiltersService.CheckCustomFilter', param.toObject());

		const res = await xcall('FiltersService.CheckCustomFilter', param.serializeBinary().buffer);
		const data = FilterOrError.deserializeBinary(res);

		log.dbg('Response data', 'FiltersService.CheckCustomFilter', data.toObject());
		return data;
	};

	/**
	 * Confirm add Custom filter
	 * @param CustomFilterToAdd param
	 * @returns OptionalError param
	 */
	ConfirmAddCustomFilter = async (param: CustomFilterToAdd): Promise<OptionalError> => {
		log.dbg('Request data', 'FiltersService.ConfirmAddCustomFilter', param.toObject());

		const res = await xcall('FiltersService.ConfirmAddCustomFilter', param.serializeBinary().buffer);
		const data = OptionalError.deserializeBinary(res);

		log.dbg('Response data', 'FiltersService.ConfirmAddCustomFilter', data.toObject());
		return data;
	};

	/**
	 * Delete custom filters
	 * @param CustomFiltersToDelete param
	 * @returns OptionalError param
	 */
	DeleteCustomFilters = async (param: CustomFiltersToDelete): Promise<OptionalError> => {
		log.dbg('Request data', 'FiltersService.DeleteCustomFilters', param.toObject());

		const res = await xcall('FiltersService.DeleteCustomFilters', param.serializeBinary().buffer);
		const data = OptionalError.deserializeBinary(res);

		log.dbg('Response data', 'FiltersService.DeleteCustomFilters', data.toObject());
		return data;
	};

	/**
	 * Update filters settings
	 * @param FiltersUpdate param
	 * @returns OptionalError param
	 */
	UpdateFilters = async (param: FiltersUpdate): Promise<OptionalError> => {
		log.dbg('Request data', 'FiltersService.UpdateFilters', param.toObject());

		const res = await xcall('FiltersService.UpdateFilters', param.serializeBinary().buffer);
		const data = OptionalError.deserializeBinary(res);

		log.dbg('Response data', 'FiltersService.UpdateFilters', data.toObject());
		return data;
	};

	/**
	 * Get filters index
	 * @param EmptyValue param
	 * @returns FiltersIndex param
	 */
	GetFiltersIndex = async (param: EmptyValue): Promise<FiltersIndex> => {
		log.dbg('Request data', 'FiltersService.GetFiltersIndex', param.toObject());

		const res = await xcall('FiltersService.GetFiltersIndex', param.serializeBinary().buffer);
		const data = FiltersIndex.deserializeBinary(res);

		log.dbg('Response data', 'FiltersService.GetFiltersIndex', data.toObject());
		return data;
	};

	/**
	 * Update custom filter
	 * @param CustomFilterUpdateRequest param
	 * @returns OptionalError param
	 */
	UpdateCustomFilter = async (param: CustomFilterUpdateRequest): Promise<OptionalError> => {
		log.dbg('Request data', 'FiltersService.UpdateCustomFilter', param.toObject());

		const res = await xcall('FiltersService.UpdateCustomFilter', param.serializeBinary().buffer);
		const data = OptionalError.deserializeBinary(res);

		log.dbg('Response data', 'FiltersService.UpdateCustomFilter', data.toObject());
		return data;
	};

	/**
	 * Request update on filter library, result will be dispatch by
	 * TrayCallbackService.OnFilterStatusResolved
	 * @param EmptyValue param
	 * @returns EmptyValue param
	 */
	RequestFiltersUpdate = async (param: EmptyValue): Promise<EmptyValue> => {
		log.dbg('Request data', 'FiltersService.RequestFiltersUpdate', param.toObject());

		const res = await xcall('FiltersService.RequestFiltersUpdate', param.serializeBinary().buffer);
		const data = EmptyValue.deserializeBinary(res);

		log.dbg('Response data', 'FiltersService.RequestFiltersUpdate', data.toObject());
		return data;
	};

	/**
	 * Request filters divided by safari extension
	 * @param EmptyValue param
	 * @returns FiltersGroupedByExtensions param
	 */
	GetFiltersGroupedByExtensions = async (param: EmptyValue): Promise<FiltersGroupedByExtensions> => {
		log.dbg('Request data', 'FiltersService.GetFiltersGroupedByExtensions', param.toObject());

		const res = await xcall('FiltersService.GetFiltersGroupedByExtensions', param.serializeBinary().buffer);
		const data = FiltersGroupedByExtensions.deserializeBinary(res);

		log.dbg('Response data', 'FiltersService.GetFiltersGroupedByExtensions', data.toObject());
		return data;
	};

	/**
	 * Update language specific
	 * @param BoolValue param
	 * @returns EmptyValue param
	 */
	UpdateLanguageSpecific = async (param: BoolValue): Promise<EmptyValue> => {
		log.dbg('Request data', 'FiltersService.UpdateLanguageSpecific', param.toObject());

		const res = await xcall('FiltersService.UpdateLanguageSpecific', param.serializeBinary().buffer);
		const data = EmptyValue.deserializeBinary(res);

		log.dbg('Response data', 'FiltersService.UpdateLanguageSpecific', data.toObject());
		return data;
	};

}
