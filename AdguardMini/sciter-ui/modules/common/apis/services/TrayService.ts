/* This code was generated automatically by proto-parser tool version 1 */


import { EmptyValue, EffectiveThemeValue } from '../types'
import { xcall } from 'ApiWindow';

/* Service that handles tray settings  */
interface ITrayService {
	/* Get effective theme */
	GetEffectiveTheme(param:EmptyValue): Promise<EffectiveThemeValue>;
}

/**
 * Service that handles tray settings
 */
export class TrayService implements ITrayService {
	/**
	 * Get effective theme
	 * @param EmptyValue param
	 * @returns EffectiveThemeValue param
	 */
	GetEffectiveTheme = async (param: EmptyValue): Promise<EffectiveThemeValue> => {
		log.dbg('Request data', 'TrayService.GetEffectiveTheme', param.toObject());

		const res = await xcall('TrayService.GetEffectiveTheme', param.serializeBinary().buffer);
		const data = EffectiveThemeValue.deserializeBinary(res);

		log.dbg('Response data', 'TrayService.GetEffectiveTheme', data.toObject());
		return data;
	};

}
