import { useEffect } from 'react';
import { useStore } from './store';
import { NotificationService } from './NotificationService';

const TICK_INTERVAL = 300000; // 5 minutes in ms
const SAFARI_TICK_INTERVAL = 3600000; // 1 hour in ms

export const useTickSystem = () => {
  const { charges, lastTickTimestamp, addCharge, consumeCharge, safariCharges, lastSafariTickTimestamp, addSafariCharge } = useStore();

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

    const checkSafariTicks = () => {
      const now = Date.now();
      const elapsed = now - lastSafariTickTimestamp;
      const newCharges = Math.floor(elapsed / SAFARI_TICK_INTERVAL);

      if (newCharges > 0 && safariCharges < 5) {
        const amountToAdd = Math.min(5 - safariCharges, newCharges);
        if (amountToAdd > 0) {
          addSafariCharge(amountToAdd);
          useStore.setState({ lastSafariTickTimestamp: lastSafariTickTimestamp + (amountToAdd * SAFARI_TICK_INTERVAL) });
          if (safariCharges + amountToAdd === 5) {
            NotificationService.sendNotification('La Zona Safari è pronta!');
          }
        }
      }
    };

    checkSafariTicks();
    const interval = setInterval(() => {
      checkTicks();
      checkSafariTicks();
    }, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [charges, lastTickTimestamp, addCharge, safariCharges, lastSafariTickTimestamp, addSafariCharge]);

  const getTimeToNextTick = () => {
    if (charges >= 6) return 0;
    const now = Date.now();
    const elapsed = now - lastTickTimestamp;
    return Math.max(0, TICK_INTERVAL - (elapsed % TICK_INTERVAL));
  };

  const getTimeToNextSafariTick = () => {
    if (safariCharges >= 5) return 0;
    const elapsed = Date.now() - lastSafariTickTimestamp;
    return Math.max(0, SAFARI_TICK_INTERVAL - (elapsed % SAFARI_TICK_INTERVAL));
  };

  return { getTimeToNextTick, getTimeToNextSafariTick };
};
