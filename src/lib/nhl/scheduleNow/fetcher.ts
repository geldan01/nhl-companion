import { nhlFetch } from '../fetcher';
import { HOSTS } from '../hosts';
import { TTL } from '../cache';
import { ScheduleNowResponse } from './schema';

export async function fetchScheduleNow(): Promise<ScheduleNowResponse> {
  return nhlFetch({
    url: `${HOSTS.web}/v1/schedule/now`,
    schema: ScheduleNowResponse,
    revalidate: TTL.scheduleNow,
  });
}
