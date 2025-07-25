// Sequelize Models
import defineUser from './User.js';
import defineTeam from './Team.js';
import defineSupportSession from './SupportSession.js';

const initializeModels = (sequelize) => {
    // Initialize all models
    const User = defineUser(sequelize);
    const Team = defineTeam(sequelize);
    const SupportSession = defineSupportSession(sequelize);

    // Store models in sequelize instance for easy access
    const models = {
        User,
        Team,
        SupportSession
    };

    // Set up associations
    Object.keys(models).forEach(modelName => {
        if (models[modelName].associate) {
            models[modelName].associate(models);
        }
    });

    return models;
};

export {
    defineUser,
    defineTeam,
    defineSupportSession,
    initializeModels
};

export default initializeModels;
