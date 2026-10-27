import mongoose from "mongoose";

const pageSchema = new mongoose.Schema(
    {
    name: String,

    path: String,

    keywords: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);
const timeSlotSchema = new mongoose.Schema(
  {
    slotId: {
      type: String,
      required: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    name: {
      type: String,
      default: "",
    },
    startTime: {
      type: String, // HH:mm format, e.g. "14:00"
      required: true,
    },
    endTime: {
      type: String, // HH:mm format, e.g. "15:00"
      required: true,
    },
    capacity: {
      type: Number, // Number of tables
      required: true,
      min: 1,
      default: 5,
    },
    seatsPerTable: {
      type: Number,
      default: 4,
      min: 1,
    },
  },
  { _id: false }
);

const bookingSettingsSchema = new mongoose.Schema(
  {
    bookingEnabled: {
      type: Boolean,
      default: false,
    },
    location: {
      type: String,
      default: "",
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },
    workingDays: {
      type: [String],
      default: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    },
    openingTime: {
      type: String,
      default: "10:00",
    },
    closingTime: {
      type: String,
      default: "22:00",
    },
    slots: {
      type: [timeSlotSchema],
      default: [],
    },
    seatsPerTable: {
      type: Number,
      default: 4,
      min: 1,
    },
    maxPartySize: {
      type: Number,
      default: 12,
      min: 1,
    },
    advanceDaysLimit: {
      type: Number,
      default: 30,
      min: 1,
    },
    minNoticeMinutes: {
      type: Number,
      default: 60,
      min: 0,
    },
    cancellationPolicy: {
      type: String,
      default: "Free cancellation up to 1 hour before your reserved time slot.",
    },
  },
  { _id: false }
);


const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    assistantName:{
        type:String,
        default:"Arin AI"
    },
    businessName:{
        type:String,
        default:""
    },
    businessType:{
        type:String,
        default:""
    },
    businessDescription:{
        type:String,
        default:""
    },
    businessLogo:{
        type:String,
        default:""
    },
    tone:{
        type:String,
        enum: [
        "friendly",
        "professional",
        "sales",
      ],
      default:"friendly"
    },
    theme:{
        type:String,
        enum:[
        "warm",
        "light",
        "dark",
        "glass",
        "neon",
      ],
      default:"warm"
    },
    enableVoice:{
        type:Boolean,
        default:true
    },
    pages:{
        type:[pageSchema],
        default:[]
    },
    enableNavigation:{
        type:Boolean,
        default:true
    },
    geminiApiKey:{
        type:String,
        default:""
    },
    geminiStatus:{
        type:String,
        enum:[
        "active",
        "quota_exceeded",
        "invalid",
      ],
      default:"active"
    },
    groqApiKey:{
        type:String,
        default:""
    },
    groqStatus:{
        type:String,
        enum:[
        "active",
        "quota_exceeded",
        "invalid",
      ],
      default:"active"
    },
    totalMessages:{
        type:Number,
        default:0
    },
    plan:{
        type:String,
        enum:["free","pro"],
        default:"free"
    },
    requestLimit: {
      type: Number,
      default: 100,
    },

    proExpiresAt: {
      type: Date,
      default: null,
    },

    isSetupComplete:{
        type:Boolean,
        default:false
    },

    bookingSettings: {
        type: bookingSettingsSchema,
        default: () => ({}),
    }

},{timestamps:true})


const User = mongoose.model("User" ,userSchema)

export default User