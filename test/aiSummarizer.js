import { SupportSession, User, Team } from "../model/index.js"; // Import all models to register them
import aiservice from "../services/aiservice.js";
import connect from "./connect.js";
// import aiservice from "../services/aiservice.js";

connect().then(async () => {
    const session = await SupportSession.findOne({ sessionId: '58d04f08-6f1d-41e4-8426-c9b46ada4039'});
    console.log(session);
    aiservice.generateSummary(session);
}).catch(err => {
    console.error("Error connecting to database:", err);
});