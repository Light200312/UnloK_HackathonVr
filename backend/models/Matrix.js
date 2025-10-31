import mongoose from 'mongoose';

const metricSchema = new mongoose.Schema({
  name: String,
  value: { type: Number, default: 0 },
  custom: { type: Boolean, default: false }
});

const matrixSchema = new mongoose.Schema({
  type:{type:String,default:"general"},
  category: String,
  metrics: [metricSchema],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

}, { timestamps: true });

const Matrix = mongoose.model('Matrix', matrixSchema);
export default Matrix;
