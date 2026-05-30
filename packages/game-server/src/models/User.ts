import { Model, Schema, model } from 'mongoose';

export interface AvatarCrop {
  x: number;
  y: number;
  s: number;
  ratio: number;
}

export interface AvatarData {
  cardName: string;
  crop: AvatarCrop;
}

export interface UserEntity {
  username: string;
  passwordHash: string;
  avatar?: AvatarData;
  createdAt: Date;
  updatedAt: Date;
}

const avatarCropSchema = new Schema<AvatarCrop>(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    s: { type: Number, required: true },
    ratio: { type: Number, required: true },
  },
  { _id: false },
);

const avatarDataSchema = new Schema<AvatarData>(
  {
    cardName: { type: String, required: true },
    crop: { type: avatarCropSchema, required: true },
  },
  { _id: false },
);

const userSchema: Schema<UserEntity> = new Schema<UserEntity>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 32,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    avatar: {
      type: avatarDataSchema,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ username: 1 }, { unique: true });

export const UserModel: Model<UserEntity> = model<UserEntity>('User', userSchema);
