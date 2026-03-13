import { useEffect } from 'react';
import { useStore } from './store';
import { NotificationService } from './NotificationService';

const TICK_INTERVAL = 300000; // 5 minutes in ms

export const useTickSystem = () => {
  const { charges, lastTickTimestamp, addCharge, consumeCharge } = useStore();

  useEffect(() => {
    const checkTicks = () => {
      const now = Date.now();
      const elapsed = now - lastTickTimestamp;
      const newCharges = Math.floor(elapsed / TICK_INTERVAL);

      if (newCharges > 0 && charges < 6) {
        const amountToAdd = Math.min(6 - charges, newCharges);
        if (amountToAdd > 0) {
          addCharge(amountToAdd);
          // Update timestamp to the last "consumed" tick point
          useStore.setState({ lastTickTimestamp: lastTickTimestamp + (amountToAdd * TICK_INTERVAL) });
          
          if (charges + amountToAdd === 6) {
            NotificationService.sendNotification("Le tue cariche sono al massimo! Vai a catturare!");
          }
        }
      }
    };

    checkTicks();
    const interval = setInterval(checkTicks, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [charges, lastTickTimestamp, addCharge]);

  const getTimeToNextTick = () => {
    if (charges >= 6) return 0;
    const now = Date.now();
    const elapsed = now - lastTickTimestamp;
    return Math.max(0, TICK_INTERVAL - (elapsed % TICK_INTERVAL));
  };

  return { getTimeToNextTick };
};
