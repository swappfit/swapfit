-- RenameIndex
ALTER TABLE `_conversationparticipants` RENAME INDEX `_ConversationParticipants_AB_unique` TO `_conversationparticipants_AB_unique`;

-- RenameIndex
ALTER TABLE `_conversationparticipants` RENAME INDEX `_ConversationParticipants_B_index` TO `_conversationparticipants_B_index`;

-- RenameIndex
ALTER TABLE `_gymtrainers` RENAME INDEX `_GymTrainers_AB_unique` TO `_gymtrainers_AB_unique`;

-- RenameIndex
ALTER TABLE `_gymtrainers` RENAME INDEX `_GymTrainers_B_index` TO `_gymtrainers_B_index`;
