/* This code was generated automatically by proto-parser tool version 1 */


import { EmptyValue, AppInfo } from '../types'
import { xcall } from 'ApiWindow';

/* Service handles about app information  */
interface IAppInfoService {
	/* Get About app info */
	GetAbout(param:EmptyValue): Promise<AppInfo>;
	/* Request to update the app */
	UpdateApp(param:EmptyValue): Promise<EmptyValue>;
}

/**
 * Service handles about app information
 */
export class AppInfoService implements IAppInfoService {
	/**
	 * Get About app info
	 * @param EmptyValue param
	 * @returns AppInfo param
	 */
	GetAbout = async (param: EmptyValue): Promise<AppInfo> => {
		log.dbg('Request data', 'AppInfoService.GetAbout', param.toObject());

		const res = await xcall('AppInfoService.GetAbout', param.serializeBinary().buffer);
		const data = AppInfo.deserializeBinary(res);

		log.dbg('Response data', 'AppInfoService.GetAbout', data.toObject());
		return data;
	};

	/**
	 * Request to update the app
	 * @param EmptyValue param
	 * @returns EmptyValue param
	 */
	UpdateApp = async (param: EmptyValue): Promise<EmptyValue> => {
		log.dbg('Request data', 'AppInfoService.UpdateApp', param.toObject());

		const res = await xcall('AppInfoService.UpdateApp', param.serializeBinary().buffer);
		const data = EmptyValue.deserializeBinary(res);

		log.dbg('Response data', 'AppInfoService.UpdateApp', data.toObject());
		return data;
	};

}
