// src/services/healthService.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const processSteps = async (tx, userId, source, data) => {
  for (const point of data) {
    await tx.stepCount.upsert({
      where: { userId_date_source: { userId, date: new Date(point.date), source } },
      update: { value: point.value },
      create: { userId, date: new Date(point.date), value: point.value, source },
    });
     const pointDate = new Date(point.date);
    const today = new Date();
    if (pointDate.toDateString() === today.toDateString()) {
      totalStepsToday += point.value;
    }
  }
    // After processing all points, check for step challenges
  if (totalStepsToday > 0) {
      const activeStepChallenges = await tx.challengeParticipant.findMany({
          where: {
              userId,
              challenge: { metric: 'steps', startDate: { lte: new Date() }, endDate: { gte: new Date() } }
          }
      });
      if (activeStepChallenges.length > 0) {
          const idsToUpdate = activeStepChallenges.map(p => p.id);
          // Here we SET the score to today's total steps, not increment
          await tx.challengeParticipant.updateMany({
              where: { id: { in: idsToUpdate } },
              data: { score: totalStepsToday }
          });
      }
  }

};

const processSleep = async (tx, userId, source, data) => {
  for (const point of data) {
    await tx.sleepSession.upsert({
      where: { userId_startDate_source: { userId, startDate: new Date(point.startDate), source } },
      update: { endDate: new Date(point.endDate) },
      create: { userId, startDate: new Date(point.startDate), endDate: new Date(point.endDate), source },
    });
  }
};

const processHeartRate = async (tx, userId, source, data) => {
  const heartRateData = data.map(p => ({
    userId,
    timestamp: new Date(p.timestamp),
    value: p.value,
    source,
  }));
  // createMany is highly efficient for bulk inserts
  await tx.heartRate.createMany({
    data: heartRateData,
    skipDuplicates: true, // Prevents errors if the client sends overlapping data
  });
};

export const syncData = async (userId, syncPayload) => {
  const { dataType, source, data } = syncPayload;

  await prisma.$transaction(async (tx) => {
    // Delegate to a specific function based on the data type
    switch (dataType) {
      case 'steps':
        await processSteps(tx, userId, source, data);
        break;
      case 'sleep':
        await processSleep(tx, userId, source, data);
        break;
      case 'heart_rate':
        await processHeartRate(tx, userId, source, data);
        break;
      default:
        // The validator prevents this, but it's good practice to have a default
        return; 
    }

    // After processing the batch, update the last sync time for this data type
    await tx.healthSync.upsert({
      where: { userId_dataType: { userId, dataType } },
      update: { lastSync: new Date() },
      create: { userId, dataType, lastSync: new Date() },
    });
  });
};

export const getLastSyncTimes = async (userId) => {
    return await prisma.healthSync.findMany({
        where: { userId }
    });
};

