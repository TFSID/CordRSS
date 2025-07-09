import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import ApiAdapterError from "../../../utils/ApiAdapterError";
import { getServerSettings } from "../api";
import { useDiscordServerAccessStatus } from "./useDiscordServerAccessStatus";

interface Props {
  serverId?: string;
}

export interface UseDiscordServerSettingsData {
  profile: {
    dateFormat: string;
    timezone: string;
  };
}

export const useDiscordServerSettings = ({ serverId }: Props) => {
  const [hasErrored, setHasErrored] = useState(false);
  const { data: accessStatus } = useDiscordServerAccessStatus({ serverId });

  const { data, error, status } = useQuery<UseDiscordServerSettingsData, ApiAdapterError>(
    ["server-settings", serverId],
    async () => {
      if (!serverId) {
        throw new Error("Server ID is required when fetching discord server settings");
      }

      const response = await getServerSettings({ serverId });

      return {
        profile: {
          dateFormat: response.result.profile.dateFormat,
          timezone: response.result.profile.timezone,
        },
      };
    },
    {
      enabled: accessStatus?.result.authorized && !hasErrored,
      onError: () => setHasErrored(true),
    }
  );

  return {
    data,
    error,
    status,
  };
};
