/* This code was generated automatically by proto-parser tool version 1 */


import { EmptyValue, EffectiveThemeValue } from '../types'
import { xcall } from 'ApiWindow';

/* Service that handles client-platform communication  */
interface IOnboardingService {
	/* Notifies that onboarding did complete. */
	OnboardingDidComplete(param:EmptyValue): Promise<EmptyValue>;
	/* Get effective theme */
	GetEffectiveTheme(param:EmptyValue): Promise<EffectiveThemeValue>;
}

/**
 * Service that handles client-platform communication
 */
export class OnboardingService implements IOnboardingService {
	/**
	 * Notifies that onboarding did complete.
	 * @param EmptyValue param
	 * @returns EmptyValue param
	 */
	OnboardingDidComplete = async (param: EmptyValue): Promise<EmptyValue> => {
		log.dbg('Request data', 'OnboardingService.OnboardingDidComplete', param.toObject());

		const res = await xcall('OnboardingService.OnboardingDidComplete', param.serializeBinary().buffer);
		const data = EmptyValue.deserializeBinary(res);

		log.dbg('Response data', 'OnboardingService.OnboardingDidComplete', data.toObject());
		return data;
	};

	/**
	 * Get effective theme
	 * @param EmptyValue param
	 * @returns EffectiveThemeValue param
	 */
	GetEffectiveTheme = async (param: EmptyValue): Promise<EffectiveThemeValue> => {
		log.dbg('Request data', 'OnboardingService.GetEffectiveTheme', param.toObject());

		const res = await xcall('OnboardingService.GetEffectiveTheme', param.serializeBinary().buffer);
		const data = EffectiveThemeValue.deserializeBinary(res);

		log.dbg('Response data', 'OnboardingService.GetEffectiveTheme', data.toObject());
		return data;
	};

}
