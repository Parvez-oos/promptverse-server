import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Prompt from '../models/Prompt';

dotenv.config();

const migrateDifficultyLevel = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/promptverse');
    console.log('Connected to MongoDB');

    const result = await Prompt.updateMany(
      { difficultyLevel: { $exists: false } },
      { $set: { difficultyLevel: 'Beginner' } }
    );

    console.log(`Updated ${result.modifiedCount} prompts with missing difficultyLevel`);
    console.log('Migration complete');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateDifficultyLevel();
