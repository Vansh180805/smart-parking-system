const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const emailToVerify = 'vanshkaushik380@gmail.com';

const verifyUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/parking_system');
        console.log('MongoDB Connected');

        const user = await User.findOne({ email: emailToVerify });

        if (user) {
            user.isVerified = true;
            user.otp = undefined;
            user.otpExpires = undefined;
            await user.save();
            console.log(`User ${emailToVerify} has been manually verified.`);
        } else {
            console.log(`User with email ${emailToVerify} not found.`);
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifyUser();
