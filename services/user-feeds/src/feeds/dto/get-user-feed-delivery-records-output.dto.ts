import { DeliveryLogStatus } from "../constants/delivery-log-status.constants";

class DeliveryLogDto {
  status: DeliveryLogStatus;
  id: string;
  mediumId: string;
  createdAt: string;
  articleIdHash?: string | null;
  details?: {
    message?: string;
    data?: Record<string, unknown>;
  };
}

class ResultDto {
  logs: DeliveryLogDto[];
}

export class GetUserFeedDeliveryRecordsOutputDto {
  result: ResultDto;
}
