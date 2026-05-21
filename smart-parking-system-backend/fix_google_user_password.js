const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');

dotenv.config();

const googleUserEmail = 'vansh0993.be23@chitkara.edu.in';
const passwordForThisUser = 'vansh@0993'; // You can change this

const fixGoogleUserPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/parking_system');
        console.log('MongoDB Connected');

        const user = await User.findOne({ email: googleUserEmail });

        if (!user) {
            console.log(`ERROR: User ${googleUserEmail} not found`);
            process.exit(1);
        }

        console.log(`Found user: ${user.email} (Role: ${user.role}, Verified: ${user.isVerified})`);

        // Set password - let pre-save hook handle hashing
        user.password = passwordForThisUser;
        
        await user.save();
        console.log(`✅ SUCCESS: Password set for ${googleUserEmail}`);
        console.log(`
    =============================================
    LOGIN CREDENTIALS:
    Email: ${googleUserEmail}
    Password: ${passwordForThisUser}
    Role: ${user.role}
    =============================================`);

        process.exit(0);
    } catch (err) {
        console.error('Error updating user:', err);
        process.exit(1);
    }
};

fixGoogleUserPassword();
