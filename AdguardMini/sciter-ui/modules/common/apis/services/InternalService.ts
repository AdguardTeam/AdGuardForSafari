/* This code was generated automatically by proto-parser tool version 1 */


import { EmptyValue, Path } from '../types'
import { xcall } from 'ApiWindow';

/* Service that handles client-platform communication  */
interface IInternalService {
	/* Opens settings window of Adguard window */
	OpenSettingsWindow(param:EmptyValue): Promise<EmptyValue>;
	/* Opens settings window of Safari */
	OpenSafariSettings(param:EmptyValue): Promise<EmptyValue>;
	/* Activates the Finder, and opens one window selecting the specified file */
	ShowInFinder(param:Path): Promise<EmptyValue>;
	/* Opens report page in default browser */
	reportAnIssue(param:EmptyValue): Promise<EmptyValue>;
}

/**
 * Service that handles client-platform communication
 */
export class InternalService implements IInternalService {
	/**
	 * Opens settings window of Adguard window
	 * @param EmptyValue param
	 * @returns EmptyValue param
	 */
	OpenSettingsWindow = async (param: EmptyValue): Promise<EmptyValue> => {
		log.dbg('Request data', 'InternalService.OpenSettingsWindow', param.toObject());

		const res = await xcall('InternalService.OpenSettingsWindow', param.serializeBinary().buffer);
		const data = EmptyValue.deserializeBinary(res);

		log.dbg('Response data', 'InternalService.OpenSettingsWindow', data.toObject());
		return data;
	};

	/**
	 * Opens settings window of Safari
	 * @param EmptyValue param
	 * @returns EmptyValue param
	 */
	OpenSafariSettings = async (param: EmptyValue): Promise<EmptyValue> => {
		log.dbg('Request data', 'InternalService.OpenSafariSettings', param.toObject());

		const res = await xcall('InternalService.OpenSafariSettings', param.serializeBinary().buffer);
		const data = EmptyValue.deserializeBinary(res);

		log.dbg('Response data', 'InternalService.OpenSafariSettings', data.toObject());
		return data;
	};

	/**
	 * Activates the Finder, and opens one window selecting the specified file
	 * @param Path param
	 * @returns EmptyValue param
	 */
	ShowInFinder = async (param: Path): Promise<EmptyValue> => {
		log.dbg('Request data', 'InternalService.ShowInFinder', param.toObject());

		const res = await xcall('InternalService.ShowInFinder', param.serializeBinary().buffer);
		const data = EmptyValue.deserializeBinary(res);

		log.dbg('Response data', 'InternalService.ShowInFinder', data.toObject());
		return data;
	};

	/**
	 * Opens report page in default browser
	 * @param EmptyValue param
	 * @returns EmptyValue param
	 */
	reportAnIssue = async (param: EmptyValue): Promise<EmptyValue> => {
		log.dbg('Request data', 'InternalService.reportAnIssue', param.toObject());

		const res = await xcall('InternalService.reportAnIssue', param.serializeBinary().buffer);
		const data = EmptyValue.deserializeBinary(res);

		log.dbg('Response data', 'InternalService.reportAnIssue', data.toObject());
		return data;
	};

}
