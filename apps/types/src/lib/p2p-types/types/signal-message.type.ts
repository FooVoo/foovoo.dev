import { SignalingType } from '../enum';

export type SignalMessageType<DataType = unknown> = {
  type: SignalingType.SIGNAL;
  data: DataType;
};
