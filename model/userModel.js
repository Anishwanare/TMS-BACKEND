import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: false,

    },
    middleName: {
        type: String,
        trim: true
    },
    lastName: {
        type: String,
        required: false,
        trim: true
    },
    email: {
        type: String,
        required: false,
        unique: true,
        trim: true,
        validate: {
            validator: function (v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: props => `${props.value} is not a valid email!`
        }
    },
    phone: {
        type: String,
        required: false,
        unique: true,
        validate: {
            validator: function (v) {
                return /^[0-9]{10,15}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    password: {
        type: String,
        required: false,
        minlength: 6
    },
    
    address: {
        type: String,
        required: false,
        trim: true
    },
    partyName: {
        type: String,
        required: false,
        trim: true
    },
    role: {
        type: String,
        enum: ["Admin", "SuperAdmin", "User"],
    },
    subscriptionModel: {
        type: String,
        enum: ['Monthly', 'Yearly', "Quarterly"],
    },
    profileImage: {
        public_id: {
            type: String,
            required: false
        },
        url: {
            type: String,
            required: false
        }
    },
    assignedRegions: {
        type: [String],
        default: []
    },
    managedAccounts: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "userModel",
    },
    notificationPreferences: {
        type: Object,
        default: {
            sms: false,
            email: false,
        }
    },
    remainingEventSlots: {
        type: Number,
        default: 0
    },
    notificationQuota: {
        type: Number,
        default: 0
    },
    lastLogin: {
        type: Date
    },
    activityLog: { // Tracks important user activities
        type: [Object], // { action: String, timestamp: Date }
        default: []
    },
    isActive: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    accountLockedUntil: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export const userModel = mongoose.model('userModel', userSchema);
