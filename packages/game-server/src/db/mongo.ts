import mongoose from 'mongoose';

import { serverConfig } from '../config';

let isConnected = false;

export async function connectMongo(): Promise<void> {
  if (isConnected) {
    return;
  }

  await mongoose.connect(serverConfig.mongoUri);
  isConnected = true;
}
