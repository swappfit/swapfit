// src/services/dashboardService.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// --- Private Helper Functions for each Tab ---

const _buildActivityData = async (userId) => {
  console.log("[_buildActivityData] START for user:", userId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Monday as start
  
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  // 1. Get Today's Steps
  const todayStepsRecord = await prisma.stepCount.findFirst({
    where: { userId, date: today },
  });
  console.log("[_buildActivityData] todayStepsRecord:", todayStepsRecord);

  const todaySteps = todayStepsRecord?.value || 0;

  // 2. Weekly Steps
  const weeklyStepsRecords = await prisma.stepCount.findMany({
    where: { userId, date: { gte: startOfWeek } },
    orderBy: { date: 'asc' },
  });
  console.log("[_buildActivityData] weeklyStepsRecords:", weeklyStepsRecords);

  const weeklySteps = Array(7).fill(0);
  weeklyStepsRecords.forEach(record => {
    const dayIndex = record.date.getDay() === 0 ? 6 : record.date.getDay() - 1;
    weeklySteps[dayIndex] = record.value;
  });

  // 3. Workout Counts
  const workoutsThisWeek = await prisma.workoutSession.count({
    where: { userId, date: { gte: startOfWeek } },
  });
  const yearToDate = await prisma.workoutSession.count({
    where: { userId, date: { gte: startOfYear } },
  });
  console.log("[_buildActivityData] workoutsThisWeek:", workoutsThisWeek, "yearToDate:", yearToDate);

  // 4. Recent Activities
  const recentSessions = await prisma.workoutSession.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 3,
  });
  console.log("[_buildActivityData] recentSessions:", recentSessions);

  const recentActivities = recentSessions.map(session => ({
      type: session.workoutType === 'Cardio' ? '🏃‍♂️' : '🏋️‍♂️',
      name: session.workoutName || 'Workout Session',
      time: session.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      duration: `${session.duration || 0} min`,
      calories: Math.round((session.duration || 0) * 8.5),
  }));

  // 5. Active Minutes + Calories
  const sessionsThisWeek = await prisma.workoutSession.findMany({
      where: { userId, date: { gte: startOfWeek } },
      select: { duration: true }
  });
  console.log("[_buildActivityData] sessionsThisWeek:", sessionsThisWeek);

  const activeMinutes = sessionsThisWeek.reduce((sum, s) => sum + (s.duration || 0), 0);
  const caloriesBurned = Math.round((todaySteps * 0.04) + (activeMinutes * 8.5));

  console.log("[_buildActivityData] END ->", { todaySteps, weeklySteps, workoutsThisWeek, yearToDate, activeMinutes, caloriesBurned });

  return {
    todaySteps,
    weeklySteps,
    workoutsThisWeek,
    yearToDate,
    recentActivities,
    activeMinutes,
    caloriesBurned,
    weeklyGoal: 10000,
    streak: 7,
    monthlyProgress: 78,
    totalCalories: 12450,
  };
};

const _buildDietData = async (userId) => {
  console.log("[_buildDietData] START for user:", userId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mealsToday = await prisma.dietLog.findMany({
    where: { userId, createdAt: { gte: today } },
  });
  console.log("[_buildDietData] mealsToday:", mealsToday);

  let todayCalories = 0, protein = 0, carbs = 0, fats = 0;
  mealsToday.forEach(meal => {
    todayCalories += meal.calories;
    protein += meal.protein || 0;
    carbs += meal.carbs || 0;
    fats += meal.fats || 0;
  });

  console.log("[_buildDietData] END ->", { todayCalories, protein, carbs, fats });

  return {
    todayCalories, protein, carbs, fats,
    meals: mealsToday.map(m => ({...m, completed: true, time: m.createdAt.toLocaleTimeString()})),
    dailyGoal: 2200,
    weeklyCalories: [2100, 1950, 2300, todayCalories, 2000, 2150, 1850],
    nutritionGoals: {}
  };
};

const _buildTrainingData = async (userId) => {
  console.log("[_buildTrainingData] START for user:", userId);

  const totalWorkouts = await prisma.workoutSession.count({ where: { userId } });
  console.log("[_buildTrainingData] totalWorkouts:", totalWorkouts);

  const workoutTypesData = await prisma.workoutSession.groupBy({
      by: ['workoutType'],
      _count: { _all: true },
      where: { userId, workoutType: { not: null } }
  });
  console.log("[_buildTrainingData] workoutTypesData:", workoutTypesData);

  const workoutTypes = workoutTypesData.map(item => ({
      name: item.workoutType,
      count: item._count._all,
      color: item.workoutType === 'Strength' ? '#e74c3c' : '#3498db',
  }));

  const upcomingWorkouts = await prisma.trainingPlanAssignment.findMany({
      where: { memberId: userId, endDate: { gte: new Date() } },
      take: 3
  });
  console.log("[_buildTrainingData] upcomingWorkouts:", upcomingWorkouts);

  console.log("[_buildTrainingData] END");

  return {
    totalWorkouts,
    workoutTypes,
    upcomingWorkouts,
    currentPlan: "Strength Training",
    weeklyProgress: 75,
    thisMonth: 4,
    achievements: []
  };
};

export const buildMemberDashboard = async (userId) => {
  console.log("[buildMemberDashboard] CALLED with userId:", userId);

  const [activityData, dietData, trainingData] = await Promise.all([
    _buildActivityData(userId),
    _buildDietData(userId),
    _buildTrainingData(userId),
  ]);

  console.log("[buildMemberDashboard] FINAL RESULT ->", {
    activity: activityData,
    diet: dietData,
    training: trainingData,
  });

  return {
    activity: activityData,
    diet: dietData,
    training: trainingData,
  };
};
