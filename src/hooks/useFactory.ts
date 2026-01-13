import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { factoryApi, Factory } from '@/api';

export const useFactory = () => {
  const { user } = useAuth();
  const [factory, setFactory] = useState<Factory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadFactory = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const factories = await factoryApi.getAll();
        if (factories.length > 0) {
          setFactory(factories[0]);
        }
      } catch (err) {
        setError(err as Error);
        console.error('Error loading factory:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFactory();
  }, [user]);

  return { factory, factoryId: factory?.id || null, loading, error, refetch: async () => {
    if (!user) return;
    const factories = await factoryApi.getAll();
    if (factories.length > 0) {
      setFactory(factories[0]);
    }
  }};
};
