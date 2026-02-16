const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const emailToVerify = 'vanshkaushik380@gmail.com';

const verifyAndPromoteUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/parking_system');
        console.log('MongoDB Connected');

        const user = await User.findOne({ email: emailToVerify });

        if (user) {
            console.log(`Found user: ${user.email} (Current Role: ${user.role}, Verified: ${user.isVerified})`);

            user.isVerified = true;
            user.otp = undefined;
            user.otpExpires = undefined;
            user.role = 'admin'; // Promote to admin as requested

            await user.save();
            console.log(`SUCCESS: User ${emailToVerify} has been verified and promoted to ADMIN.`);
        } else {
            console.log(`ERROR: User with email ${emailToVerify} not found. Please register first.`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error updating user:', err);
        process.exit(1);
    }
};

verifyAndPromoteUser();
