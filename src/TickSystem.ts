import { useEffect } from 'react';
import { useStore } from './store';
import { NotificationService } from './NotificationService';

const TICK_INTERVAL = 300000; // 5 minutes in ms
const SAFARI_TICK_INTERVAL = 900000; // 15 minutes in ms
const SAFARI_MAX_CHARGES = 8;
const REGIONAL_TICK_INTERVAL = 7200000; // 2 ore in ms
const REGIONAL_MAX_CHARGES = 3;
const ISLAND_TICK_INTERVAL = 14400000; // 4 ore in ms
const ISLAND_MAX_CHARGES = 3;

export const useTickSystem = () => {
  const { charges, lastTickTimestamp, addCharge, consumeCharge, safariCharges, lastSafariTickTimestamp, addSafariCharge, regionalCharges, lastRegionalTickTimestamp, addRegionalCharge, islandCharges, lastIslandTickTimestamp, addIslandCharge } = useStore();

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

    const checkRegionalTicks = () => {
      const now = Date.now();
      const elapsed = now - lastRegionalTickTimestamp;
      const newCharges = Math.floor(elapsed / REGIONAL_TICK_INTERVAL);
      if (newCharges > 0 && regionalCharges < REGIONAL_MAX_CHARGES) {
        const amountToAdd = Math.min(REGIONAL_MAX_CHARGES - regionalCharges, newCharges);
        if (amountToAdd > 0) {
          addRegionalCharge(amountToAdd);
          useStore.setState({
            lastRegionalTickTimestamp: lastRegionalTickTimestamp + amountToAdd * REGIONAL_TICK_INTERVAL,
          });
        }
      }
    };

    const checkIslandTicks = () => {
      const now = Date.now();
      const elapsed = now - lastIslandTickTimestamp;
      const newCharges = Math.floor(elapsed / ISLAND_TICK_INTERVAL);
      if (newCharges > 0 && islandCharges < ISLAND_MAX_CHARGES) {
        const amountToAdd = Math.min(ISLAND_MAX_CHARGES - islandCharges, newCharges);
        if (amountToAdd > 0) {
          addIslandCharge(amountToAdd);
          useStore.setState({
            lastIslandTickTimestamp: lastIslandTickTimestamp + amountToAdd * ISLAND_TICK_INTERVAL,
          });
        }
      }
    };

    const checkSafariTicks = () => {
      const now = Date.now();
      const elapsed = now - lastSafariTickTimestamp;
      const newCharges = Math.floor(elapsed / SAFARI_TICK_INTERVAL);

      if (newCharges > 0 && safariCharges < SAFARI_MAX_CHARGES) {
        const amountToAdd = Math.min(SAFARI_MAX_CHARGES - safariCharges, newCharges);
        if (amountToAdd > 0) {
          addSafariCharge(amountToAdd);
          useStore.setState({ lastSafariTickTimestamp: lastSafariTickTimestamp + (amountToAdd * SAFARI_TICK_INTERVAL) });
          if (safariCharges + amountToAdd === SAFARI_MAX_CHARGES) {
            NotificationService.sendNotification('Le cariche Safari sono al massimo!');
          }
        }
      }
    };

    checkSafariTicks();
    checkRegionalTicks();
    checkIslandTicks();
    const interval = setInterval(() => {
      checkTicks();
      checkSafariTicks();
      checkRegionalTicks();
      checkIslandTicks();
    }, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [charges, lastTickTimestamp, addCharge, safariCharges, lastSafariTickTimestamp, addSafariCharge, regionalCharges, lastRegionalTickTimestamp, addRegionalCharge, islandCharges, lastIslandTickTimestamp, addIslandCharge]);

  const getTimeToNextTick = () => {
    if (charges >= 6) return 0;
    const now = Date.now();
    const elapsed = now - lastTickTimestamp;
    return Math.max(0, TICK_INTERVAL - (elapsed % TICK_INTERVAL));
  };

  const getTimeToNextSafariTick = () => {
    if (safariCharges >= SAFARI_MAX_CHARGES) return 0;
    const elapsed = Date.now() - lastSafariTickTimestamp;
    return Math.max(0, SAFARI_TICK_INTERVAL - (elapsed % SAFARI_TICK_INTERVAL));
  };

  const getTimeToNextRegionalTick = () => {
    if (regionalCharges >= REGIONAL_MAX_CHARGES) return 0;
    const elapsed = Date.now() - lastRegionalTickTimestamp;
    return Math.max(0, REGIONAL_TICK_INTERVAL - (elapsed % REGIONAL_TICK_INTERVAL));
  };

  return { getTimeToNextTick, getTimeToNextSafariTick, getTimeToNextRegionalTick };
};
