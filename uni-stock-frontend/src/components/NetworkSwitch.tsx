import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useNetworkSwitch } from '../hooks/useNetworkSwitch';

export default function NetworkSwitch() {
  const { isSwitching, switchToSepolia, isSepolia } = useNetworkSwitch();
  const [isOnSepolia, setIsOnSepolia] = useState<boolean | null>(null);

  useEffect(() => {
    const checkNetwork = async () => {
      const onSepolia = await isSepolia();
      setIsOnSepolia(onSepolia);
    };
    checkNetwork();
  }, [isSepolia]);

  const handleSwitchToSepolia = async () => {
    try {
      await switchToSepolia();
      setIsOnSepolia(true);
    } catch (error) {
      console.error('Failed to switch to Sepolia:', error);
    }
  };

  if (isOnSepolia === null) {
    return <div>Checking network...</div>;
  }

  if (isOnSepolia) {
    return (
      <Badge variant="outline" className="bg-green-100 text-green-800">
        Sepolia Active
      </Badge>
    );
  }

  return (
    <Button
      onClick={handleSwitchToSepolia}
      disabled={isSwitching}
      variant="outline"
      size="sm"
    >
      {isSwitching ? 'Switching...' : 'Switch to Sepolia'}
    </Button>
  );
}
