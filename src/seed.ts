import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User';
import Prompt from './models/Prompt';

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/promptverse');
    console.log('MongoDB connected for seeding...');

    const existingAdmin = await User.findOne({ email: 'admin@promptverse.com' });
    if (existingAdmin) {
      console.log('Admin user already exists.');
      await mongoose.disconnect();
      return;
    }

    const hashedPassword = await bcrypt.hash('Admin@123', 12);

    await User.create({
      name: 'Admin',
      email: 'admin@promptverse.com',
      password: hashedPassword,
      role: 'admin',
      isPremium: true,
    });

    console.log('Admin user created successfully.');
    console.log('Email: admin@promptverse.com');
    console.log('Password: Admin@123');

    await mongoose.disconnect();
    console.log('Seeding complete.');
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

const seedDifficultyPrompts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/promptverse');
    console.log('MongoDB connected for seeding difficulty prompts...');

    const admin = await User.findOne({ email: 'admin@promptverse.com' });
    if (!admin) {
      console.error('Admin user not found. Run seedAdmin first.');
      await mongoose.disconnect();
      return;
    }

    const existingCount = await Prompt.countDocuments({
      difficultyLevel: { $in: ['Beginner', 'Intermediate', 'Pro'] },
    });
    if (existingCount >= 9) {
      console.log('Difficulty-level prompts already exist. Skipping.');
      await mongoose.disconnect();
      return;
    }

    const prompts = [
      {
        title: 'Simple Email Draft Assistant',
        description: 'A beginner-friendly prompt for drafting professional and casual emails with proper tone and structure.',
        content: 'Help me write an email with the following details:\n\nPurpose: [e.g., job application, follow-up, request]\nRecipient: [e.g., manager, client, colleague]\nTone: [e.g., formal, friendly, urgent]\nKey points to include: [list your main points]\n\nPlease provide a clear, well-structured email with:\n1. A professional subject line\n2. Appropriate greeting\n3. Concise body with clear call-to-action\n4. Proper closing and signature',
        category: 'Writing',
        aiTool: 'ChatGPT',
        tags: ['email', 'writing', 'beginner', 'communication'],
        difficultyLevel: 'Beginner',
        status: 'approved',
        isFeatured: false,
        creator: admin._id,
        copyCount: 120,
        reviewCount: 25,
      },
      {
        title: 'Basic Image Description Generator',
        description: 'A simple prompt to generate descriptions for images, useful for accessibility and social media captions.',
        content: 'Describe the following image in detail:\n\n[Upload or describe the image]\n\nPlease include:\n1. Main subject and setting\n2. Colors and mood\n3. Any text visible\n4. A suggested caption for social media\n5. Alt text for accessibility',
        category: 'Writing',
        aiTool: 'ChatGPT',
        tags: ['images', 'description', 'accessibility', 'beginner'],
        difficultyLevel: 'Beginner',
        status: 'approved',
        isFeatured: false,
        creator: admin._id,
        copyCount: 95,
        reviewCount: 18,
      },
      {
        title: 'Weekly Meal Planner',
        description: 'A straightforward prompt for generating a balanced weekly meal plan with shopping list.',
        content: 'Create a weekly meal plan for me:\n\nDietary preferences: [e.g., vegetarian, gluten-free, none]\nMeals per day: [e.g., 3 meals + 2 snacks]\nBudget: [e.g., low, medium, high]\nCooking skill: [beginner]\n\nPlease provide:\n1. 7-day meal plan with breakfast, lunch, dinner, and snacks\n2. Simple recipes for each meal\n3. Consolidated shopping list\n4. Preparation tips for beginners\n5. Nutritional highlights',
        category: 'Lifestyle',
        aiTool: 'ChatGPT',
        tags: ['meal planning', 'health', 'beginner', 'cooking'],
        difficultyLevel: 'Beginner',
        status: 'approved',
        isFeatured: false,
        creator: admin._id,
        copyCount: 88,
        reviewCount: 15,
      },
      {
        title: 'Advanced Data Analysis with Multi-Step Reasoning',
        description: 'A complex prompt for performing multi-step data analysis with chain-of-thought reasoning and statistical validation.',
        content: 'Analyze the following dataset using multi-step reasoning: First, identify patterns and outliers. Then, apply statistical tests to validate your findings. Finally, provide actionable insights with confidence intervals.\n\nDataset: [Insert your data here]\n\nSteps:\n1. Initial exploration and data quality check\n2. Pattern recognition and hypothesis formation\n3. Statistical validation\n4. Insight generation with confidence levels',
        category: 'Data Analysis',
        aiTool: 'ChatGPT',
        tags: ['data analysis', 'statistics', 'reasoning', 'advanced'],
        difficultyLevel: 'Intermediate',
        status: 'approved',
        isFeatured: true,
        creator: admin._id,
        copyCount: 45,
        reviewCount: 8,
      },
      {
        title: 'Multi-Language Code Refactoring Assistant',
        description: 'Expert-level prompt for refactoring code across multiple programming languages with performance optimization.',
        content: 'Refactor the following code for optimal performance and maintainability:\n\n[Paste your code here]\n\nRequirements:\n1. Identify code smells and anti-patterns\n2. Apply SOLID principles\n3. Optimize time and space complexity\n4. Add comprehensive error handling\n5. Ensure cross-language compatibility if applicable',
        category: 'Coding',
        aiTool: 'Claude',
        tags: ['coding', 'refactoring', 'optimization', 'software engineering'],
        difficultyLevel: 'Intermediate',
        status: 'approved',
        isFeatured: true,
        creator: admin._id,
        copyCount: 62,
        reviewCount: 12,
      },
      {
        title: 'Research Paper Analysis and Critique',
        description: 'Deep analysis prompt for academic research papers with methodology evaluation and limitation identification.',
        content: 'Provide a comprehensive analysis of this research paper:\n\n[Paste paper abstract or key sections here]\n\nAnalysis Framework:\n1. Methodology critique (sample size, controls, bias)\n2. Statistical validity assessment\n3. Comparison with existing literature\n4. Practical implications and limitations\n5. Suggestions for future research',
        category: 'Writing',
        aiTool: 'ChatGPT',
        tags: ['research', 'academic', 'analysis', 'critical thinking'],
        difficultyLevel: 'Intermediate',
        status: 'approved',
        creator: admin._id,
        copyCount: 38,
        reviewCount: 6,
      },
      {
        title: 'Enterprise Architecture Design Consultant',
        description: 'Professional-grade prompt for designing scalable enterprise architecture with microservices and cloud integration.',
        content: 'Design an enterprise architecture for the following business requirements:\n\n[Describe your system requirements]\n\nArchitecture Deliverables:\n1. System decomposition into microservices\n2. API gateway and service mesh design\n3. Database strategy (polyglot persistence)\n4. Event-driven architecture patterns\n5. Security and compliance framework\n6. Deployment and scaling strategy\n7. Cost optimization recommendations',
        category: 'Coding',
        aiTool: 'ChatGPT',
        tags: ['architecture', 'enterprise', 'microservices', 'cloud', 'devops'],
        difficultyLevel: 'Pro',
        status: 'approved',
        isFeatured: true,
        creator: admin._id,
        copyCount: 71,
        reviewCount: 15,
      },
      {
        title: 'AI Model Fine-Tuning Strategy',
        description: 'Expert prompt for developing comprehensive AI model fine-tuning strategies with evaluation metrics.',
        content: 'Develop a fine-tuning strategy for the following AI model scenario:\n\n[Describe your model and use case]\n\nStrategy Components:\n1. Data preparation and augmentation pipeline\n2. Hyperparameter optimization approach\n3. Training schedule with learning rate warmup\n4. Regularization techniques (dropout, weight decay)\n5. Evaluation metrics and benchmarks\n6. A/B testing framework\n7. Monitoring and drift detection',
        category: 'AI & ML',
        aiTool: 'ChatGPT',
        tags: ['AI', 'machine learning', 'fine-tuning', 'deep learning'],
        difficultyLevel: 'Pro',
        status: 'approved',
        creator: admin._id,
        copyCount: 54,
        reviewCount: 9,
      },
      {
        title: 'Quantitative Trading Strategy Development',
        description: 'Advanced prompt for developing and backtesting quantitative trading strategies with risk management.',
        content: 'Develop a quantitative trading strategy for the following market conditions:\n\n[Describe market/asset]\n\nStrategy Framework:\n1. Signal generation methodology\n2. Entry/exit criteria with confidence thresholds\n3. Position sizing (Kelly criterion, fixed fraction)\n4. Risk management (stop-loss, drawdown limits)\n5. Backtesting methodology with walk-forward analysis\n6. Performance metrics (Sharpe, Sortino, max drawdown)\n7. Implementation considerations (latency, slippage)',
        category: 'Finance',
        aiTool: 'ChatGPT',
        tags: ['trading', 'quantitative', 'finance', 'risk management'],
        difficultyLevel: 'Pro',
        status: 'approved',
        creator: admin._id,
        copyCount: 43,
        reviewCount: 7,
      },
    ];

    const result = await Prompt.insertMany(prompts);
    console.log(`Seeded ${result.length} difficulty-level prompts (Beginner, Intermediate & Pro).`);

    await mongoose.disconnect();
    console.log('Difficulty seeding complete.');
  } catch (error) {
    console.error('Difficulty seeding error:', error);
    process.exit(1);
  }
};

const args = process.argv.slice(2);
if (args.includes('--difficulty')) {
  seedDifficultyPrompts();
} else {
  seedAdmin();
}
