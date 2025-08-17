import { useState, useEffect } from 'react';
import { VisualizationData, Release, PackageChange } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

export const useVisualizationData = () => {
  const [data, setData] = useState<VisualizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/visualization`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('データ取得エラー:', err);
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refetch = () => {
    fetchData();
  };

  return { data, loading, error, refetch };
};

export const useReleases = () => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReleases = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${API_BASE_URL}/releases`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setReleases(data);
      } catch (err) {
        console.error('リリース情報取得エラー:', err);
        setError(err instanceof Error ? err.message : 'リリース情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchReleases();
  }, []);

  return { releases, loading, error };
};

export const usePackages = () => {
  const [packages, setPackages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${API_BASE_URL}/packages`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setPackages(data);
      } catch (err) {
        console.error('パッケージ情報取得エラー:', err);
        setError(err instanceof Error ? err.message : 'パッケージ情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  return { packages, loading, error };
};

export const usePackageChanges = (packageName: string) => {
  const [changes, setChanges] = useState<PackageChange[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!packageName) return;

    const fetchPackageChanges = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${API_BASE_URL}/package/${encodeURIComponent(packageName)}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setChanges(data);
      } catch (err) {
        console.error('パッケージ変更情報取得エラー:', err);
        setError(err instanceof Error ? err.message : 'パッケージ変更情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchPackageChanges();
  }, [packageName]);

  return { changes, loading, error };
};

export const useHealthCheck = () => {
  const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setDetails(data);
        setStatus(data.status === 'ok' ? 'ok' : 'error');
      } catch (err) {
        console.error('ヘルスチェックエラー:', err);
        setStatus('error');
        setDetails({ error: err instanceof Error ? err.message : 'API接続に失敗しました' });
      }
    };

    checkHealth();
  }, []);

  return { status, details };
};

export const refreshData = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/refresh`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return true;
  } catch (err) {
    console.error('データ更新エラー:', err);
    return false;
  }
};