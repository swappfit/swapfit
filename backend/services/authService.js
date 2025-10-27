// src/services/authService.js
import { PrismaClient } from '@prisma/client';
import chargebeeModule from 'chargebee-typescript';
import AppError from '../utils/AppError.js';
import { slugify } from '../utils/slugify.js';

const prisma = new PrismaClient();

// ✅ USING YOUR WORKING INITIALIZATION LOGIC - THIS IS CORRECT
const { ChargeBee } = chargebeeModule;
const chargebee = new ChargeBee();
chargebee.configure({
  site: process.env.CHARGEBEE_SITE,
  api_key: process.env.CHARGEBEE_API_KEY
});

// A robust helper for idempotently creating/retrieving Chargebee items
const findOrCreateChargebeeItem = async (itemId, itemName) => {
  try {
    const result = await chargebee.item.create({
      id: itemId,
      name: itemName,
      type: "plan",
      item_family_id: process.env.CHARGEBEE_ITEM_FAMILY_ID
    }).request();
    console.log(`[Chargebee] Created new item: ${itemId}`);
    return result.item;
  } catch (error) {
    if (error.api_error_code === 'duplicate_entry') {
      console.log(`[Chargebee Idempotency] Item ${itemId} already exists. Retrieving it.`);
      const result = await chargebee.item.retrieve(itemId).request();
      return result.item;
    }
    throw error;
  }
};

// NEW: Helper for creating item prices with unique names
const createChargebeeItemPrice = async (priceData, maxRetries = 5) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Chargebee] Attempting to create price: ${priceData.id} (Attempt ${attempt}/${maxRetries})`);
      
      // First, try to retrieve the price to see if it already exists
      try {
        const existingPrice = await chargebee.item_price.retrieve(priceData.id).request();
        console.log(`[Chargebee] Found existing price: ${priceData.id}`);
        return existingPrice.item_price;
      } catch (retrieveError) {
        // Price doesn't exist, proceed with creation
        if (retrieveError.api_error_code !== 'resource_not_found') {
          throw retrieveError;
        }
      }
      
      // Try to create the price
      const result = await chargebee.item_price.create(priceData).request();
      console.log(`[Chargebee] Successfully created price: ${priceData.id}`);
      return result.item_price;
    } catch (error) {
      lastError = error;
      
      // Handle duplicate entry - this means the price was created but not yet retrievable
      if (error.api_error_code === 'duplicate_entry') {
        console.log(`[Chargebee] Price already exists, waiting and retrying retrieval: ${priceData.id}`);
        
        // Wait longer for propagation
        const delay = Math.min(5000 * attempt, 30000); // Longer delay for duplicate entries
        console.log(`[Chargebee] Waiting ${delay}ms before retrying retrieval`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Try to retrieve again
        try {
          const retrieveResult = await chargebee.item_price.retrieve(priceData.id).request();
          console.log(`[Chargebee] Successfully retrieved price after wait: ${priceData.id}`);
          return retrieveResult.item_price;
        } catch (retrieveError) {
          console.log(`[Chargebee] Still failed to retrieve price after wait: ${priceData.id}. Error: ${retrieveError.message}`);
          if (attempt < maxRetries) {
            continue;
          }
        }
      }
      
      // For other errors, wait before retrying
      if (attempt < maxRetries) {
        const delay = Math.min(2000 * attempt, 10000);
        console.log(`[Chargebee] Retry attempt ${attempt}/${maxRetries} after ${delay}ms. Error: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error(`[Chargebee] Failed to create price after ${maxRetries} attempts: ${priceData.id}`);
  throw lastError;
};

// --- Unified Role & Profile Management ---

export const selectRole = async ({ userId, role }) => {
  console.log(`[AuthService] User ID ${userId} is selecting role: ${role}`);
  const normalizedRole = role.toUpperCase();
  const validRoles = ['MEMBER', 'GYM_OWNER', 'TRAINER', 'MERCHANT'];
  if (!validRoles.includes(normalizedRole)) throw new AppError('Invalid role specified.', 400);

  const user = await prisma.user.update({ where: { id: userId }, data: { role: normalizedRole } });

  let redirectTo = '';
  switch (normalizedRole) {
    case 'MEMBER': redirectTo = '/create-member-profile'; break;
    case 'GYM_OWNER': redirectTo = '/create-gym-profile'; break;
    case 'TRAINER': redirectTo = '/create-trainer-profile'; break;
    case 'MERCHANT': redirectTo = '/create-merchant-profile'; break;
    default: redirectTo = '/dashboard';
  }
  console.log(`[AuthService] Role for User ID ${userId} updated to ${normalizedRole}. Redirecting to: ${redirectTo}`);
  return { role: user.role, redirectTo };
};

export const createProfile = async ({ userId, profileType, data, authPayload }) => {
  try {
    switch (profileType) {
      case 'MEMBER': {
        if (!authPayload || !authPayload.sub) { 
          throw new AppError('MEMBER profile creation requires a valid Auth0 token payload.', 401); 
        }
        const user = await prisma.user.findUnique({ where: { auth0_id: authPayload.sub } });
        if (!user) { 
          throw new AppError(`Authenticated user with Auth0 ID ${authPayload.sub} could not be found.`, 404); 
        }
        const memberData = {
          name: data.name, 
          age: data.age, 
          gender: data.gender,
          weight: typeof data.weight === 'object' ? data.weight.value : data.weight,
          height: typeof data.height === 'object' ? data.height.value : data.height,
          fitnessGoal: data.fitnessGoal, 
          healthConditions: data.healthConditions,
        };
        return await prisma.memberProfile.update({ 
          where: { userId: user.id }, 
          data: memberData 
        });
      }

      case 'TRAINER': {
        const { plans: trainerPlansData, gallery, ...trainerData } = data;
        
        // First, create the trainer profile without Chargebee operations
        const profile = await prisma.$transaction(async (tx) => {
          const profile = await tx.trainerProfile.upsert({
            where: { userId },
            update: { 
              ...trainerData, 
              gallery: gallery || [] // Ensure gallery is an array
            },
            create: { 
              userId, 
              ...trainerData, 
              gallery: gallery || [] // Ensure gallery is an array
            },
            include: { user: { select: { email: true } } }
          });

          // Delete existing plans
          await tx.trainerPlan.deleteMany({ where: { trainerProfileId: profile.id } });

          // Filter valid plans
          const validPlans = (trainerPlansData || []).filter(p =>
            p.name && p.name.trim() !== '' &&
            p.duration && p.duration.trim() !== '' &&
            p.price != null && p.price !== '' && !isNaN(parseFloat(p.price)) && parseFloat(p.price) > 0
          );

          // Create plans in database without Chargebee IDs first
          const createdPlans = [];
          if (validPlans.length > 0) {
            for (const planData of validPlans) {
              const plan = await tx.trainerPlan.create({
                data: {
                  trainerProfileId: profile.id, 
                  name: planData.name, 
                  price: parseFloat(planData.price),
                  duration: planData.duration, 
                  chargebeePlanId: null, // Will be updated later
                },
              });
              createdPlans.push({ plan, planData });
            }
          }
          
          return { profile, createdPlans };
        });

        // Now perform Chargebee operations outside the transaction
        const updatedPlans = [];
        for (const { plan, planData } of profile.createdPlans) {
          try {
            // Generate a unique ID for this price attempt
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 1000);
            
            // Use slugify for the plan name in the item ID
            const chargebeeItemId = `trainer-${profile.profile.id}-${slugify(planData.name)}-${timestamp}-${random}`;
            const chargebeeItemName = `${profile.profile.user.email} - ${planData.name}`;

            // Create or get Chargebee item
            const chargebeeProduct = await findOrCreateChargebeeItem(chargebeeItemId, chargebeeItemName);
            
            // Wait for propagation
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Use slugify for the price ID as well
            const chargebeePriceId = `${chargebeeItemId}-${slugify(planData.duration.toLowerCase())}`;

            // Create Chargebee price - use the price ID as the name to ensure uniqueness
            const chargebeePriceResult = await createChargebeeItemPrice({
              id: chargebeePriceId,
              name: chargebeePriceId, // Use the price ID as the name to ensure uniqueness
              item_id: chargebeeProduct.id,
              price: Math.round(parseFloat(planData.price) * 100),
              period: 1,
              period_unit: planData.duration.toLowerCase(),
              currency_code: "INR"
            });

            // Update the plan with Chargebee ID
            const updatedPlan = await prisma.trainerPlan.update({
              where: { id: plan.id },
              data: { chargebeePlanId: chargebeePriceResult.id }
            });
            
            updatedPlans.push(updatedPlan);
          } catch(e) {
            console.error(`[Chargebee FAILURE] Failed to create Trainer Plan Price for '${planData.name}'. Error: ${e.message}`);
            // Keep the original plan without Chargebee ID
            updatedPlans.push(plan);
          }
        }

        return { ...profile.profile, plans: updatedPlans };
      }

      case 'GYM_OWNER': {
        const { plans: gymPlansData, ...gymData } = data;
        
        // First, create the gym without Chargebee operations
        const gym = await prisma.$transaction(async (tx) => {
          const gym = await tx.gym.upsert({
            where: { managerId: userId },
            update: gymData,
            create: { ...gymData, managerId: userId },
          });

          // Delete existing plans
          await tx.gymPlan.deleteMany({ where: { gymId: gym.id } });

          // Filter valid plans
          const validPlans = (gymPlansData || []).filter(p =>
            p.name && p.name.trim() !== '' &&
            p.duration && p.duration.trim() !== '' &&
            p.price != null && p.price !== '' && !isNaN(parseFloat(p.price)) && parseFloat(p.price) > 0
          );

          // Create plans in database without Chargebee IDs first
          const createdPlans = [];
          if (validPlans.length > 0) {
            for (const planData of validPlans) {
              const plan = await tx.gymPlan.create({
                data: {
                  gymId: gym.id, 
                  name: planData.name, 
                  price: parseFloat(planData.price),
                  duration: planData.duration, 
                  chargebeePlanId: null, // Will be updated later
                },
              });
              createdPlans.push({ plan, planData });
            }
          }
          
          return { gym, createdPlans };
        });

        // Now perform Chargebee operations outside the transaction
        const updatedPlans = [];
        for (const { plan, planData } of gym.createdPlans) {
          try {
            // Generate a unique ID for this price attempt
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 1000);
            
            // Use slugify for the plan name in the item ID
            const chargebeeItemId = `gym-${gym.gym.id}-${slugify(planData.name)}-${timestamp}-${random}`;
            const chargebeeItemName = `${gym.gym.name} - ${planData.name}`;

            // Create or get Chargebee item
            const chargebeeProduct = await findOrCreateChargebeeItem(chargebeeItemId, chargebeeItemName);
            
            // Wait for propagation
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Use slugify for the price ID as well
            const chargebeePriceId = `${chargebeeItemId}-${slugify(planData.duration.toLowerCase())}`;

            // Create Chargebee price - use the price ID as the name to ensure uniqueness
            const chargebeePriceResult = await createChargebeeItemPrice({
              id: chargebeePriceId,
              name: chargebeePriceId, // Use the price ID as the name to ensure uniqueness
              item_id: chargebeeProduct.id,
              price: Math.round(parseFloat(planData.price) * 100),
              period: 1,
              period_unit: planData.duration.toLowerCase(),
              currency_code: "INR"
            });

            // Update the plan with Chargebee ID
            const updatedPlan = await prisma.gymPlan.update({
              where: { id: plan.id },
              data: { chargebeePlanId: chargebeePriceResult.id }
            });
            
            updatedPlans.push(updatedPlan);
          } catch(e) {
            console.error(`[Chargebee CRITICAL FAILURE] Could not link Gym Plan Price for '${planData.name}'. Error: ${e.message}`);
            // Keep the original plan without Chargebee ID
            updatedPlans.push(plan);
          }
        }

        return { ...gym.gym, plans: updatedPlans };
      }
      case 'MERCHANT':
        return await prisma.merchantProfile.upsert({
          where: { userId }, 
          update: data, 
          create: { ...data, userId },
        });

      default:
        throw new AppError('Invalid profile type provided.', 400);
    }
  } catch (error) {
    console.error(`[AuthService] ERROR during createProfile:`, error);
    if (error.type === 'chargebee') {
      throw new AppError(`A billing service error occurred: ${error.message}`, 500);
    }
    throw error;
  }
};

// --- Auth0 Specific Services ---
export const verifyAuth0User = async (auth0Payload) => {
  try {
    const basicUser = await prisma.user.findUnique({ where: { auth0_id: auth0Payload.sub } });
    if (basicUser) { 
      return getFullUserById(basicUser.id); 
    }
    const email = auth0Payload.email || `user_${auth0Payload.sub}@placeholder.com`;
    const newUser = await prisma.user.create({ 
      data: { 
        auth0_id: auth0Payload.sub, 
        email, 
        provider: 'auth0' 
      } 
    });
    const { password, ...userResponse } = newUser;
    return userResponse;
  } catch (error) {
    console.error(`[AuthService] Error in verifyAuth0User:`, error);
    throw new Error('Failed to verify or create user due to a database error.');
  }
};

export const verifyMember = async (auth0Payload) => {
  try {
    let user = await prisma.user.findUnique({ 
      where: { auth0_id: auth0Payload.sub }, 
      include: { memberProfile: true } 
    });
    
    if (user) {
      if (user.role === 'MEMBER' && !user.memberProfile) {
        await prisma.memberProfile.create({ data: { userId: user.id } });
        user = await prisma.user.findUnique({ 
          where: { id: user.id }, 
          include: { memberProfile: true }
        });
      }
      const { password, ...userResponse } = user;
      return userResponse;
    }
    
    const email = auth0Payload.email || `user_${auth0Payload.sub}@placeholder.com`;
    const newUser = await prisma.user.create({
      data: { 
        auth0_id: auth0Payload.sub, 
        email, 
        provider: 'auth0', 
        role: 'MEMBER', 
        memberProfile: { create: {} } 
      },
      include: { memberProfile: true }
    });
    const { password, ...userResponse } = newUser;
    return userResponse;
  } catch (error) {
    console.error(`[AuthService] Error in verifyMember:`, error);
    throw error;
  }
};

// --- HELPER FUNCTIONS ---
export const getUserByAuth0Id = async (auth0Sub) => {
  const user = await prisma.user.findUnique({ where: { auth0_id: auth0Sub } });
  if (!user) { 
    throw new AppError('User not found for the provided Auth0 ID', 404); 
  }
  return user;
};

export const getFullUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { 
      memberProfile: true, 
      managedGyms: true, 
      trainerProfile: true, 
      merchantProfile: true 
    },
  });
  if (!user) { 
    throw new AppError('User not found.', 404); 
  }
  const { password, ...userResponse } = user;
  return userResponse;
};

// ✅✅✅ NEW ATOMIC SERVICE FUNCTION ✅✅✅
export const verifyAndPromoteToAdmin = async (auth0Payload) => {
  const auth0Id = auth0Payload.sub;
  const email = auth0Payload.email || `user_${auth0Id}@placeholder.com`;

  console.log(`[AuthService] Verifying and promoting user ${auth0Id} to ADMIN.`);

  // upsert = "Update or Insert". This is a single, atomic operation.
  const user = await prisma.user.upsert({
    where: { auth0_id: auth0Id },
    update: {
      role: 'ADMIN', // Always set role to ADMIN on login for this portal
      email: email,   // Update email in case it changed in Auth0
    },
    create: {
      auth0_id: auth0Id,
      email: email,
      provider: 'auth0',
      role: 'ADMIN', // Set role to ADMIN on creation
    },
    include: { // Include all profiles to return a complete object
      memberProfile: true,
      managedGyms: true,
      trainerProfile: true,
      merchantProfile: true,
    },
  });

  const { password, ...userResponse } = user;
  console.log(`[AuthService] User ${userResponse.id} verified and promoted to ADMIN.`);
  return userResponse;
};