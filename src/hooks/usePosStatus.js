import { useState, useEffect, useCallback } from 'react';
import { adminApiUtils } from '@/services/adminApi';

/**
 * Hook to check PoS integration status for the current tenant.
 * Determines if Clover or Square is connected and active.
 * 
 * When a PoS system is connected, order status management should be handled
 * through the PoS system (via webhooks) rather than manually in BistroBytes.
 * 
 * @returns {Object} PoS status information:
 *   - hasCloverIntegration: boolean - Clover is connected
 *   - hasSquareIntegration: boolean - Square is connected
 *   - hasPosIntegration: boolean - Any PoS is connected
 *   - posProvider: string|null - 'Clover', 'Square', or null
 *   - isLoading: boolean - Status is being fetched
 *   - error: string|null - Error message if fetch failed
 *   - refetch: function - Manually refresh the status
 */
export function usePosStatus() {
  const [posStatus, setPosStatus] = useState({
    hasCloverIntegration: false,
    hasSquareIntegration: false,
    isLoading: true,
    error: null
  });

  const fetchStatus = useCallback(async () => {
    setPosStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check both integrations in parallel
      // Each call is wrapped in a catch to prevent one failure from blocking the other
      const [cloverRes, squareRes] = await Promise.all([
        adminApiUtils.getCloverStatus().catch((err) => {
          console.debug('Clover status check failed:', err.message);
          return { data: { isConnected: false } };
        }),
        adminApiUtils.getSquareStatus().catch((err) => {
          console.debug('Square status check failed:', err.message);
          return { data: { isConnected: false } };
        })
      ]);

      // Extract connection status from responses
      // Each API returns { isConnected: boolean, ... }
      const hasClover = cloverRes?.data?.isConnected === true;
      const hasSquare = squareRes?.data?.isConnected === true;

      setPosStatus({
        hasCloverIntegration: hasClover,
        hasSquareIntegration: hasSquare,
        isLoading: false,
        error: null
      });

    } catch (error) {
      console.error('Failed to fetch PoS status:', error);
      setPosStatus({
        hasCloverIntegration: false,
        hasSquareIntegration: false,
        isLoading: false,
        error: error.message || 'Failed to check PoS integration status'
      });
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Compute derived values
  const hasPosIntegration = posStatus.hasCloverIntegration || posStatus.hasSquareIntegration;
  
  // Determine which provider is connected (Square takes precedence if both are connected)
  let posProvider = null;
  if (posStatus.hasSquareIntegration) {
    posProvider = 'Square';
  } else if (posStatus.hasCloverIntegration) {
    posProvider = 'Clover';
  }

  return {
    ...posStatus,
    hasPosIntegration,
    posProvider,
    refetch: fetchStatus
  };
}

export default usePosStatus;
