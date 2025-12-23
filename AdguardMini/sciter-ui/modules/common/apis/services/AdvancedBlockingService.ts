/* This code was generated automatically by proto-parser tool version 1 */


import { EmptyValue, AdvancedBlocking } from '../types'
import { xcall } from 'ApiWindow';

/* Service handles Advanced blocking page  */
interface IAdvancedBlockingService {
	/* Get AdvancedBlocking settings */
	GetAdvancedBlocking(param:EmptyValue): Promise<AdvancedBlocking>;
	/* Update AdvancedBlocking */
	UpdateAdvancedBlocking(param:AdvancedBlocking): Promise<EmptyValue>;
}

/**
 * Service handles Advanced blocking page
 */
export class AdvancedBlockingService implements IAdvancedBlockingService {
	/**
	 * Get AdvancedBlocking settings
	 * @param EmptyValue param
	 * @returns AdvancedBlocking param
	 */
	GetAdvancedBlocking = async (param: EmptyValue): Promise<AdvancedBlocking> => {
		log.dbg('Request data', 'AdvancedBlockingService.GetAdvancedBlocking', param.toObject());

		const res = await xcall('AdvancedBlockingService.GetAdvancedBlocking', param.serializeBinary().buffer);
		const data = AdvancedBlocking.deserializeBinary(res);

		log.dbg('Response data', 'AdvancedBlockingService.GetAdvancedBlocking', data.toObject());
		return data;
	};

	/**
	 * Update AdvancedBlocking
	 * @param AdvancedBlocking param
	 * @returns EmptyValue param
	 */
	UpdateAdvancedBlocking = async (param: AdvancedBlocking): Promise<EmptyValue> => {
		log.dbg('Request data', 'AdvancedBlockingService.UpdateAdvancedBlocking', param.toObject());

		const res = await xcall('AdvancedBlockingService.UpdateAdvancedBlocking', param.serializeBinary().buffer);
		const data = EmptyValue.deserializeBinary(res);

		log.dbg('Response data', 'AdvancedBlockingService.UpdateAdvancedBlocking', data.toObject());
		return data;
	};

}
