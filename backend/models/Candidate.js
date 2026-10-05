const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    name: String,
    experience: String,
    current_salary: String,
    location: String,

    current_designation: String,
    standardized_designation: String,
    current_company: String,

    previous_designation: String,
    standardized_previous_designation: String,
    previous_company: String,

    education: String,

    preferred_locations: [String],
    key_skills: [String],
    additional_skills: [String],

    profile: String,
    phone: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Candidate", candidateSchema);