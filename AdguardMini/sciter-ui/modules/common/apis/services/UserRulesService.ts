/* This code was generated automatically by proto-parser tool version 1 */


import { EmptyValue, UserRules, StringValue, OptionalError, Path } from '../types'
import { xcall } from 'ApiWindow';

/* Service that handles client-platform communication  */
interface IUserRulesService {
	/* Get UserRules settings */
	GetUserRules(param:EmptyValue): Promise<UserRules>;
	/* Add UserRule */
	AddUserRule(param:StringValue): Promise<OptionalError>;
	/* Update UserRules settings */
	UpdateUserRules(param:UserRules): Promise<OptionalError>;
	/* Export UserRules settings */
	ExportUserRules(param:Path): Promise<OptionalError>;
	/* Import UserRules settings */
	ImportUserRules(param:Path): Promise<UserRules>;
	/* Reset UserRules to default settings */
	ResetUserRules(param:EmptyValue): Promise<UserRules>;
}

/**
 * Service that handles client-platform communication
 */
export class UserRulesService implements IUserRulesService {
	/**
	 * Get UserRules settings
	 * @param EmptyValue param
	 * @returns UserRules param
	 */
	GetUserRules = async (param: EmptyValue): Promise<UserRules> => {
		log.dbg('Request data', 'UserRulesService.GetUserRules', param.toObject());

		const res = await xcall('UserRulesService.GetUserRules', param.serializeBinary().buffer);
		const data = UserRules.deserializeBinary(res);

		log.dbg('Response data', 'UserRulesService.GetUserRules', data.toObject());
		return data;
	};

	/**
	 * Add UserRule
	 * @param StringValue param
	 * @returns OptionalError param
	 */
	AddUserRule = async (param: StringValue): Promise<OptionalError> => {
		log.dbg('Request data', 'UserRulesService.AddUserRule', param.toObject());

		const res = await xcall('UserRulesService.AddUserRule', param.serializeBinary().buffer);
		const data = OptionalError.deserializeBinary(res);

		log.dbg('Response data', 'UserRulesService.AddUserRule', data.toObject());
		return data;
	};

	/**
	 * Update UserRules settings
	 * @param UserRules param
	 * @returns OptionalError param
	 */
	UpdateUserRules = async (param: UserRules): Promise<OptionalError> => {
		log.dbg('Request data', 'UserRulesService.UpdateUserRules', param.toObject());

		const res = await xcall('UserRulesService.UpdateUserRules', param.serializeBinary().buffer);
		const data = OptionalError.deserializeBinary(res);

		log.dbg('Response data', 'UserRulesService.UpdateUserRules', data.toObject());
		return data;
	};

	/**
	 * Export UserRules settings
	 * @param Path param
	 * @returns OptionalError param
	 */
	ExportUserRules = async (param: Path): Promise<OptionalError> => {
		log.dbg('Request data', 'UserRulesService.ExportUserRules', param.toObject());

		const res = await xcall('UserRulesService.ExportUserRules', param.serializeBinary().buffer);
		const data = OptionalError.deserializeBinary(res);

		log.dbg('Response data', 'UserRulesService.ExportUserRules', data.toObject());
		return data;
	};

	/**
	 * Import UserRules settings
	 * @param Path param
	 * @returns UserRules param
	 */
	ImportUserRules = async (param: Path): Promise<UserRules> => {
		log.dbg('Request data', 'UserRulesService.ImportUserRules', param.toObject());

		const res = await xcall('UserRulesService.ImportUserRules', param.serializeBinary().buffer);
		const data = UserRules.deserializeBinary(res);

		log.dbg('Response data', 'UserRulesService.ImportUserRules', data.toObject());
		return data;
	};

	/**
	 * Reset UserRules to default settings
	 * @param EmptyValue param
	 * @returns UserRules param
	 */
	ResetUserRules = async (param: EmptyValue): Promise<UserRules> => {
		log.dbg('Request data', 'UserRulesService.ResetUserRules', param.toObject());

		const res = await xcall('UserRulesService.ResetUserRules', param.serializeBinary().buffer);
		const data = UserRules.deserializeBinary(res);

		log.dbg('Response data', 'UserRulesService.ResetUserRules', data.toObject());
		return data;
	};

}
