import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Prompt from '../models/Prompt';

dotenv.config();

const redistributeDifficultyLevels = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/promptverse');
    console.log('Connected to MongoDB');

    const allPrompts = await Prompt.find().select('_id difficultyLevel title').lean();
    const total = allPrompts.length;
    console.log(`Total prompts found: ${total}`);

    if (total === 0) {
      console.log('No prompts to redistribute.');
      await mongoose.disconnect();
      return;
    }

    for (const level of ['Beginner', 'Intermediate', 'Pro']) {
      const count = allPrompts.filter(p => p.difficultyLevel === level).length;
      console.log(`Current ${level}: ${count}`);
    }

    const shuffled = allPrompts.sort(() => Math.random() - 0.5);

    const perLevel = Math.floor(total / 3);
    const remainder = total % 3;

    const beginnerCount = perLevel + (remainder > 0 ? 1 : 0);
    const intermediateCount = perLevel + (remainder > 1 ? 1 : 0);
    const proCount = perLevel;

    console.log(`\nRedistributing: ${beginnerCount} Beginner, ${intermediateCount} Intermediate, ${proCount} Pro`);

    const assignments = [
      ...Array(beginnerCount).fill('Beginner'),
      ...Array(intermediateCount).fill('Intermediate'),
      ...Array(proCount).fill('Pro'),
    ];

    const bulkOps = shuffled.map((prompt, index) => ({
      updateOne: {
        filter: { _id: prompt._id },
        update: { $set: { difficultyLevel: assignments[index] } },
      },
    }));

    const result = await Prompt.bulkWrite(bulkOps);
    console.log(`\nUpdated ${result.modifiedCount} prompts successfully.`);

    const updated = await Prompt.find().select('difficultyLevel').lean();
    for (const level of ['Beginner', 'Intermediate', 'Pro']) {
      const count = updated.filter(p => p.difficultyLevel === level).length;
      console.log(`Final ${level}: ${count}`);
    }

    await mongoose.disconnect();
    console.log('\nRedistribution complete.');
  } catch (error) {
    console.error('Redistribution failed:', error);
    process.exit(1);
  }
};

redistributeDifficultyLevels();
