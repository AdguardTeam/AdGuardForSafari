/* This code was generated automatically by proto-parser tool version 1 */


import { TelemetryEvent, EmptyValue } from '../types'
import { xcall } from 'ApiWindow';

/* Service that handles telemetry events  */
interface ITelemetryService {
	/* Record telemetry event */
	RecordEvent(param:TelemetryEvent): Promise<EmptyValue>;
}

/**
 * Service that handles telemetry events
 */
export class TelemetryService implements ITelemetryService {
	/**
	 * Record telemetry event
	 * @param TelemetryEvent param
	 * @returns EmptyValue param
	 */
	RecordEvent = async (param: TelemetryEvent): Promise<EmptyValue> => {
		log.dbg('Request data', 'TelemetryService.RecordEvent', param.toObject());

		const res = await xcall('TelemetryService.RecordEvent', param.serializeBinary().buffer);
		const data = EmptyValue.deserializeBinary(res);

		log.dbg('Response data', 'TelemetryService.RecordEvent', data.toObject());
		return data;
	};

}
