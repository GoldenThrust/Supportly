import "dotenv/config";
import { v4 as uuid } from "uuid";
import readline from "readline";
import mailService from "../config/mailservice.js";
import { database } from "../config/db.js";
import { redis } from "../config/redis.js";
import { hash } from "argon2";
import Team from "../model/Team.js";
import User from "../model/User.js";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (question) => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
};

const askPassword = (question) => {
    return new Promise((resolve) => {
        process.stdout.write(question);
        process.stdin.setRawMode(true);
        process.stdin.resume();
        let password = '';

        const onData = (char) => {
            char = char.toString();
            if (char === '\n' || char === '\r' || char === '\u0004') {
                // Clean up before resolving
                process.stdin.removeListener('data', onData);
                process.stdin.setRawMode(false);
                process.stdin.pause();
                process.stdout.write('\n');
                resolve(password);
            } else if (char === '\u0003') {
                process.exit();
            } else if (char === '\b' || char === '\u007f') {
                if (password.length > 0) {
                    password = password.slice(0, -1);
                    process.stdout.write('\b \b');
                }
            } else {
                password += char;
                process.stdout.write('*');
            }
        };

        process.stdin.on('data', onData);
    });
};

const createUser = async () => {
    const name = await askQuestion('Enter User Name: ');
    const email = await askQuestion('Enter User Email: ');
    const role = await askQuestion('Enter Role (admin/support_agent/customer): ');
    const password = await askQuestion('Enter User Password: ');

    if (!name || !email || !password || !role) {
        console.log('All fields are required!');
        return;
    }

    const hashedPassword = await hash(password);
    const user = { name, email, password: hashedPassword, role };
    const token = uuid();

    await redis.set(`activations-token:${token}`, JSON.stringify(user), 60 * 60 * 24);
    await mailService.sendEmailVerification(user, token);

    console.log('User created successfully!');
};

const createTeam = async () => {
    const teamName = await askQuestion('Enter Team Name: ');
    const description = await askQuestion('Enter Team Description: ');

    console.log('\nAvailable departments:');
    console.log('1. technical');
    console.log('2. billing');
    console.log('3. general');
    console.log('4. sales');
    console.log('5. escalation');
    const deptChoice = await askQuestion('Select department (1-5): ');

    const departments = { '1': 'technical', '2': 'billing', '3': 'general', '4': 'sales', '5': 'escalation' };
    const department = departments[deptChoice];

    const maxConcurrentSessions = await askQuestion('Enter max concurrent sessions (default 10): ') || '10';
    const workingStart = await askQuestion('Enter working hours start (HH:MM, default 09:00): ') || '09:00';
    const workingEnd = await askQuestion('Enter working hours end (HH:MM, default 17:00): ') || '17:00';
    const timezone = await askQuestion('Enter timezone (default UTC): ') || 'UTC';

    if (!teamName || !description || !department) {
        console.log('Name, description, and department are required!');
        return;
    }

    try {
        const team = new Team({
            name: teamName,
            description,
            department,
            maxConcurrentSessions: parseInt(maxConcurrentSessions),
            workingHours: {
                start: workingStart,
                end: workingEnd,
                timezone,
                workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
            }
        });

        await team.save();
        console.log(`Team "${teamName}" created successfully with ID: ${team._id}`);
    } catch (error) {
        if (error.code === 11000) {
            console.log('Team name already exists!');
        } else {
            console.log('Error creating team:', error.message);
        }
    }
};

const addUserToTeam = async () => {
    const email = await askQuestion('Enter User Email: ');
    const teamId = await askQuestion('Enter Team ID: ');

    console.log('\nAvailable roles:');
    console.log('1. member');
    console.log('2. lead');
    console.log('3. manager');
    const roleChoice = await askQuestion('Select role (1-3): ');

    const roles = { '1': 'member', '2': 'lead', '3': 'manager' };
    const teamRole = roles[roleChoice];

    if (!email || !teamId || !teamRole) {
        console.log('All fields are required!');
        return;
    }

    try {
        // Check if team exists
        const team = await Team.findById(teamId);
        if (!team) {
            console.log('Team not found!');
            return;
        }

        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found!');
            return;
        } else if (user.role === 'customer') {
            console.log('User is a customer and cannot be added to a team!');
            return;
        }

        if (teamRole === 'lead' && team.leaderId) {
            console.log('This team already has a leader!');
            return;
        } else if (teamRole === 'lead') {
            team.leaderId = user;
        }

        team.addMember(user);
        user.teamId = team;
        await team.save();
        await user.save();
    } catch (error) {
        console.log('Error adding user to team:', error.message);
    }
};

const listTeams = async () => {
    try {
        const teams = await Team.find({ isActive: true }).select('_id name department description activeMembersCount');

        if (teams.length === 0) {
            console.log('No teams found.');
            return;
        }

        console.log('\n=== Active Teams ===');
        teams.forEach(team => {
            console.log(`ID: ${team._id}`);
            console.log(`Name: ${team.name}`);
            console.log(`Department: ${team.department}`);
            console.log(`Description: ${team.description}`);
            console.log(`Active Members: ${team.activeMembersCount}`);
            console.log('---');
        });
    } catch (error) {
        console.log('Error listing teams:', error.message);
    }
};

const showMenu = async () => {
    console.log('\n=== User/Team Management ===');
    console.log('1. Create User');
    console.log('2. Create Team');
    console.log('3. Add User to Team');
    console.log('4. List Teams');
    console.log('5. Exit');

    const choice = await askQuestion('Select an option (1-5): ');

    switch (choice) {
        case '1':
            await createUser();
            break;
        case '2':
            await createTeam();
            break;
        case '3':
            await addUserToTeam();
            break;
        case '4':
            await listTeams();
            break;
        case '5':
            console.log('Goodbye!');
            rl.close();
            process.exit(0);
        default:
            console.log('Invalid option!');
    }

    // Show menu again unless exiting
    if (choice !== '5') {
        await showMenu();
    }
};

database.connect().then(() => {
    redis.connect().then(async () => {
        try {
            await showMenu();
        } catch (error) {
            console.error('Error:', error);
            rl.close();
            process.exit(1);
        }
    });
});

