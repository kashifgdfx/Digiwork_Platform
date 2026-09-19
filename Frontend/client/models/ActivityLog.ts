import mongoose, { Schema, model, models } from 'mongoose';

export interface IActivityLog {
  gigId: string;
  mouseMoves: number;
  keyPresses: number;
  timestamp: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  gigId: { type: String, required: true, index: true },
  mouseMoves: { type: Number, required: true },
  keyPresses: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

export const ActivityLog = models.ActivityLog || model<IActivityLog>('ActivityLog', ActivityLogSchema);
