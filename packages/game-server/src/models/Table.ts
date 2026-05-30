import { Model, Schema, model } from 'mongoose';

export type TableStatus = 'OPEN' | 'IN_GAME' | 'CLOSED';

export interface TableSeat {
  seatIndex: number;
  userId?: string;
  username: string;
  isBot: boolean;
}

export interface TableEntity {
  name: string;
  ownerUserId: string;
  ownerUsername: string;
  status: TableStatus;
  maxPlayers: number;
  requiredCardNames: string[];
  seats: TableSeat[];
  closedSeatIndexes: number[];
  rematchProposedByUserId?: string;
  rematchAcceptedUserIds: string[];
  rematchUnavailable: boolean;
  startedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const tableSeatSchema: Schema<TableSeat> = new Schema<TableSeat>(
  {
    seatIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    userId: {
      type: String,
      required: false,
    },
    username: {
      type: String,
      required: true,
    },
    isBot: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { _id: false },
);

const tableSchema: Schema<TableEntity> = new Schema<TableEntity>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 64,
    },
    ownerUserId: {
      type: String,
      required: true,
      index: true,
    },
    ownerUsername: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['OPEN', 'IN_GAME', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
    maxPlayers: {
      type: Number,
      required: true,
      min: 2,
      max: 6,
    },
    requiredCardNames: {
      type: [String],
      required: true,
      default: [],
    },
    seats: {
      type: [tableSeatSchema],
      required: true,
      default: [],
    },
    closedSeatIndexes: {
      type: [Number],
      required: true,
      default: [],
    },
    rematchProposedByUserId: {
      type: String,
      required: false,
    },
    rematchAcceptedUserIds: {
      type: [String],
      required: true,
      default: [],
    },
    rematchUnavailable: {
      type: Boolean,
      required: true,
      default: false,
    },
    startedAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

tableSchema.index({ status: 1, createdAt: -1 });

export const TableModel: Model<TableEntity> = model<TableEntity>('Table', tableSchema);
