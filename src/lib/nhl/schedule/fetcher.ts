import { nhlFetch } from '../fetcher';
import { HOSTS } from '../hosts';
import { TTL } from '../cache';
import { ScheduleResponse } from './schema';

export async function fetchSchedule(date: string): Promise<ScheduleResponse> {
  return nhlFetch({
    url: `${HOSTS.web}/v1/schedule/${date}`,
    schema: ScheduleResponse,
    revalidate: TTL.schedule(date),
  });
}
