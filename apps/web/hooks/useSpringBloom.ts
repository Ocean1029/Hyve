import { useState, useEffect } from 'react';
import { AppState } from '@hyve/types';
import type { SpringBloomEntry } from '@hyve/types';
import { getSpringBloomDataAction } from '@/modules/friends/actions';

/**
 * Hook to load Spring Bloom data
 * Only loads when QUARTERLY_FEEDBACK state is activated
 */
export function useSpringBloom(appState: AppState) {
  const [springBloomData, setSpringBloomData] = useState<SpringBloomEntry[]>([]);
  const [springBloomLoading, setSpringBloomLoading] = useState(false);

  useEffect(() => {
    if (appState === AppState.QUARTERLY_FEEDBACK && springBloomData.length === 0 && !springBloomLoading) {
      const loadSpringBloomData = async () => {
        setSpringBloomLoading(true);
        try {
          console.log('Loading Spring Bloom data...');
          const result = await getSpringBloomDataAction();
          console.log('Spring Bloom data result:', result);
          if (result.success && result.data) {
            setSpringBloomData(result.data);
            console.log('Spring Bloom data loaded:', result.data.length, 'friends');
          } else {
            console.error('Failed to load Spring Bloom data:', result.error);
            setSpringBloomData([]);
          }
        } catch (error) {
          console.error('Error loading Spring Bloom data:', error);
          setSpringBloomData([]);
        } finally {
          setSpringBloomLoading(false);
        }
      };
      loadSpringBloomData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState]);

  /**
   * Reset Spring Bloom data (used when closing Spring Recap)
   */
  const resetSpringBloomData = () => {
    setSpringBloomData([]);
  };

  return {
    springBloomData,
    springBloomLoading,
    resetSpringBloomData,
  };
}
