import MongoDBService from '@utils/mongo-db';
import { fetchRegion } from '@utils/region';
import logger from '@utils/logger';
import { isDev, delayRandom } from '@utils/helpers';
import { syncToPostgres } from '@utils/postgres';

interface RegionData {
  region: string;
  zillow: {
    rentals: {
      payload: {
        isDebugRequest: boolean;
        requestId: number;
        searchQueryState: {
          filterState: {
            [key: string]: {
              value: boolean;
            };
          };
          pagination: {};
          mapBounds: {
            east: number;
            south: number;
            north: number;
            west: number;
          };
          customRegionId: string;
          isListVisible: boolean;
          isMapVisible: boolean;
          mapZoom: number;
        };
        wants: {
          cat1: string[];
        };
      };
      cookies: string;
      url: string;
    };
    properties: {
      payload: {
        isDebugRequest: boolean;
        requestId: number;
        searchQueryState: {
          filterState: {
            sortSelection: {
              value: string;
            };
            isAllHomes: {
              value: boolean;
            };
          };
          pagination: {};
          mapBounds: {
            east: number;
            south: number;
            north: number;
            west: number;
          };
          customRegionId: string;
          isListVisible: boolean;
          isMapVisible: boolean;
          mapZoom: number;
        };
        wants: {
          cat1: string[];
          cat2: string[];
        };
      };
      cookies: string;
      url: string;
    };
  };
  redfin: {
    rentals: {
      url: string;
    };
    properties: {
      url: string;
    };
  };
  relatedIndexes: string[];
  id: string;
}

export const runJob = async () => {
  const mongo = MongoDBService.getInstance();
  const registeredRegions = await mongo.data.get('registered_indexes');

  const records = registeredRegions?.records ?? ([] as RegionData[]);
  logger.info(
    `Starting execution of the cron job. Regions ${records.map(({ region }) => region).join(', ')} will be synced.`,
  );

  for (const [index, { region }] of records.entries()) {
    try {
      const results = await fetchRegion(region);
      logger.info(`Region "${region}" successfully synced. ${results?.length} records processed.`);
    } catch (error) {
      logger.error(`Error syncing region "${region}":`, error);
    }

    if (!isDev && index < records.length - 1) {
      await delayRandom(10, 20);
    }
  }

  syncToPostgres();
};
