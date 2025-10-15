// src/hooks/useRefreshAndClose.js
import { useState, useCallback } from 'react';

export const useRefreshAndClose = (refreshFunction, onClose) => {
  const [refreshing, setRefreshing] = useState(false);
  const [showRefreshSuccess, setShowRefreshSuccess] = useState(false);

  const handleRefreshAndClose = useCallback(async () => {
    setRefreshing(true);
    setShowRefreshSuccess(false);
    
    try {
      await refreshFunction();
      setShowRefreshSuccess(true);
      
      // Hide the success message after 2 seconds and then close
      setTimeout(() => {
        setShowRefreshSuccess(false);
        setRefreshing(false);
        if (onClose) {
          onClose();
        }
      }, 2000);
    } catch (error) {
      console.error("Error refreshing data:", error);
      setRefreshing(false);
    }
  }, [refreshFunction, onClose]);

  return {
    refreshing,
    showRefreshSuccess,
    handleRefreshAndClose
  };
};