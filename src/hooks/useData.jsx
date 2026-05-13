import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { subscribeProperties, subscribeDocuments, getExpiryStatus } from '../lib/db';

const DataContext = createContext(null);

// Single global subscription — all pages share this data, no duplicate Firestore reads
export function DataProvider({ children }) {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [documents,  setDocuments]  = useState([]);
  const [loadingProps, setLoadingProps] = useState(true);
  const [loadingDocs,  setLoadingDocs]  = useState(true);

  useEffect(() => {
    if (!user) {
      setProperties([]); setDocuments([]);
      setLoadingProps(false); setLoadingDocs(false);
      return;
    }

    setLoadingProps(true);
    setLoadingDocs(true);

    const unsubProps = subscribeProperties(user.uid, (data) => {
      setProperties(data);
      setLoadingProps(false);
    });

    const unsubDocs = subscribeDocuments(user.uid, (data) => {
      setDocuments(data);
      setLoadingDocs(false);
    });

    return () => { unsubProps(); unsubDocs(); };
  }, [user?.uid]);

  const alertCount = documents.filter(d => {
    const { status } = getExpiryStatus(d.expiryDate, d.reminderDays);
    return status === 'expired' || status === 'expiring';
  }).length;

  return (
    <DataContext.Provider value={{
      properties, documents, alertCount,
      loading: loadingProps || loadingDocs,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
