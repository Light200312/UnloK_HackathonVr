import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['video', 'podcast', 'article', 'book', 'task', 'reflection'],
    required: true
  },
  name: { type: String, required: true },
  url: { type: String }
});

const challengeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Challenge info
  title: { type: String, required: true },
  description: { type: String },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily'
  },

  // Matrix and metric reference
  metricCategory: { type: String, required: true },
  subMetric: { type: String, required: true },

  // Optional AI-generated resource
  resource: resourceSchema,

  // Scoring and tracking
  value: { type: Number, default: 5, min: 1, max: 20 },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  expiresAt: { type: Date, index: { expires: 0 } },
  // testA:{type:String},
  createdAt: { type: Date, default: Date.now }
});

const Challenge = mongoose.model('Challenge', challengeSchema);
export default Challenge;
