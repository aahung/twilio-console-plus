import React, { useCallback, useEffect, useState } from "react";

interface Properties {
  children: React.ReactNode;
}

/**
 * Render the children until the Twilio credential becomes available.
 */
const CredentialWaiter: React.FC<Properties> = ({ children }) => {
  const [loaded, setLoaded] = useState(false);
  const [, setIntervalId] = useState<number>();

  const clearInterval = useCallback(() => {
    setIntervalId((previousIntervalId) => {
      if (previousIntervalId) {
        window.clearInterval(previousIntervalId);
      }
      return 0;
    });
  }, []);

  useEffect(() => {
    const callback = () => {
      if (window.ptTwilioCreds) {
        setLoaded(true);
        clearInterval();
      }
    };
    setIntervalId((previousIntervalId) => {
      if (previousIntervalId) {
        window.clearInterval(previousIntervalId);
      }
      return window.setInterval(callback, 200);
    });

    return clearInterval;
  }, [clearInterval]);

  return loaded ? children : undefined;
};

export default CredentialWaiter;
