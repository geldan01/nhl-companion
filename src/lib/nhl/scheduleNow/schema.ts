// /v1/schedule/now returns the same shape as /v1/schedule/{date}, so we
// reuse the schema. Re-exported here under a module-friendly name so callers
// (and the schema test) don't need to know about the cross-module reuse.

// `ScheduleResponse` is both a value (the Zod schema) and a type alias of the
// inferred output. One re-export covers both.
export { ScheduleResponse as ScheduleNowResponse } from '../schedule/schema';
