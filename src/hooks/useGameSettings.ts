import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { describeError } from '@/lib/errors';
import { parseGameSettings, type GameSetupConfig } from '@/lib/games/gameConfig';
import { supabase } from '@/lib/supabase';

const GAME_SETTINGS_METADATA_KEY = 'game_settings';
const SAVE_DELAY_MS = 800;

export function useGameSettings(): {
  config: GameSetupConfig;
  updateConfig: (next: GameSetupConfig) => void;
  saveError: string | null;
} {
  const { user } = useAuth();
  const [config, setConfig] = useState<GameSetupConfig>(() =>
    parseGameSettings(user?.user_metadata?.[GAME_SETTINGS_METADATA_KEY]),
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const pendingConfig = useRef<GameSetupConfig | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushSave = useCallback((next: GameSetupConfig) => {
    pendingConfig.current = null;
    void supabase.auth
      .updateUser({ data: { [GAME_SETTINGS_METADATA_KEY]: next } })
      .then(({ error }) => {
        if (error) setSaveError(describeError(error));
      });
  }, []);

  const updateConfig = useCallback(
    (next: GameSetupConfig) => {
      setConfig(next);
      setSaveError(null);
      pendingConfig.current = next;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (pendingConfig.current) flushSave(pendingConfig.current);
      }, SAVE_DELAY_MS);
    },
    [flushSave],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        if (pendingConfig.current) flushSave(pendingConfig.current);
      }
    };
  }, [flushSave]);

  return { config, updateConfig, saveError };
}
