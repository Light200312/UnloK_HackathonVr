import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  type: { type: String, enum: ['video', 'podcast', 'article', 'book', 'task', 'reflection'], required: true },
  name: { type: String, required: true },
  url: String,
});

const singleChallengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  text: String,
  image: String,
  metricCategory: { type: String, required: true },
  subMetric: { type: String, required: true },
  resource: resourceSchema,
   submitted: { type: Boolean, default: false },
  submittedAt: { type: Date, default: null },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
});

const challengeBatchSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },

    challenges: [singleChallengeSchema],

    totalValue: { type: Number, default: 1, min: 1 },
    completedCount: { type: Number, default: 0 },
    progress: { type: Number, default: 0 },
    eligibleForPoints: { type: Boolean, default: false },

    expiresAt: { type: Date, required: true },
    submissionClosed: { type: Boolean, default: false }, // 🚫 blocks submissions after time limit
    submissionMade: { type: Boolean, default: false }, // ✅ tracks if user submitted at least once
  },
  { timestamps: true }
);

// Auto-calculate progress
challengeBatchSchema.pre('save', function (next) {
  if (this.challenges?.length > 0) {
    const completed = this.challenges.filter(c => c.completed).length;
    this.completedCount = completed;
    this.progress = Math.round((completed / this.challenges.length) * 100);
    this.eligibleForPoints = completed >= 4;
    this.totalValue = this.challenges.length * 5;
  }

  // ⏰ automatically mark submissionClosed if expired
  if (this.expiresAt && Date.now() > this.expiresAt.getTime()) {
    this.submissionClosed = true;
  }

  next();
});

challengeBatchSchema.index({ userId: 1, type: 1 }, { unique: true });

const ChallengeBatch = mongoose.model('ChallengeBatch', challengeBatchSchema);
export default ChallengeBatch;
