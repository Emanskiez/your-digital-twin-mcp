import { Index } from "@upstash/vector";
import fs from "fs";
import "dotenv/config";

const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

async function populateDatabase() {
  try {
    console.log("📝 Loading professional profile data...\n");

    // Read the digitaltwin.json file
    const profileData = JSON.parse(
      fs.readFileSync("data/digitaltwin.json", "utf-8")
    );

    // Create content chunks from the JSON structure
    const chunks: Array<{ id: string; text: string; metadata: any }> = [];

    // Personal Information
    chunks.push({
      id: "personal-info",
      text: `Name: ${profileData.personal_information.name}. Location: ${profileData.personal_information.location}. Fields of interest: ${profileData.personal_information.fields_of_interest.join(", ")}. Career focus: ${profileData.personal_information.career_focus}. Availability: ${profileData.personal_information.availability}`,
      metadata: {
        title: "Personal Information",
        type: "personal",
        content: `Name: ${profileData.personal_information.name}. Location: ${profileData.personal_information.location}. Fields of interest: ${profileData.personal_information.fields_of_interest.join(", ")}. Career focus: ${profileData.personal_information.career_focus}`,
      },
    });

    // Salary Expectations
    chunks.push({
      id: "salary-expectations",
      text: `Salary expectations: ${profileData.salary_expectations.hourly_rate} for ${profileData.salary_expectations.role_type}. ${profileData.salary_expectations.notes}`,
      metadata: {
        title: "Salary Expectations",
        type: "compensation",
        content: `Salary expectations: ${profileData.salary_expectations.hourly_rate} for ${profileData.salary_expectations.role_type}`,
      },
    });

    // Education
    chunks.push({
      id: "education",
      text: `Education: ${profileData.education.degree} specializing in ${profileData.education.specialization}. Status: ${profileData.education.status}. Expected graduation: ${profileData.education.expected_graduation}. Relevant coursework: ${profileData.education.relevant_coursework.join(", ")}. Additional learning: ${profileData.education.additional_learning.join(", ")}`,
      metadata: {
        title: "Education",
        type: "education",
        content: `Education: ${profileData.education.degree} specializing in ${profileData.education.specialization}. Status: ${profileData.education.status}`,
      },
    });

    // Certifications
    chunks.push({
      id: "certifications",
      text: `Certifications in progress: ${profileData.certifications.in_progress.join(", ")}. Target certifications: ${profileData.certifications.target_certifications.join(", ")}`,
      metadata: {
        title: "Certifications",
        type: "credentials",
        content: `Certifications in progress: ${profileData.certifications.in_progress.join(", ")}. Target: ${profileData.certifications.target_certifications.join(", ")}`,
      },
    });

    // Networking Skills
    chunks.push({
      id: "networking-skills",
      text: `Networking skills: ${profileData.skills.networking_skills.join(", ")}`,
      metadata: {
        title: "Networking Skills",
        type: "skills",
        content: `Networking skills: ${profileData.skills.networking_skills.join(", ")}`,
      },
    });

    // Technical Skills
    chunks.push({
      id: "technical-skills",
      text: `Technical skills: ${profileData.skills.technical_skills.join(", ")}`,
      metadata: {
        title: "Technical Skills",
        type: "skills",
        content: `Technical skills: ${profileData.skills.technical_skills.join(", ")}`,
      },
    });

    // Tools and Platforms
    chunks.push({
      id: "tools",
      text: `Tools and platforms: ${profileData.skills.tools_and_platforms.join(", ")}`,
      metadata: {
        title: "Tools and Platforms",
        type: "skills",
        content: `Tools and platforms: ${profileData.skills.tools_and_platforms.join(", ")}`,
      },
    });

    // Soft Skills
    chunks.push({
      id: "soft-skills",
      text: `Soft skills: ${profileData.skills.soft_skills.join(", ")}`,
      metadata: {
        title: "Soft Skills",
        type: "skills",
        content: `Soft skills: ${profileData.skills.soft_skills.join(", ")}`,
      },
    });

    // Projects
    profileData.projects.forEach((project: any, idx: number) => {
      let projectText = `Project: ${project.name}. Description: ${project.description}.`;
      
      if (project.role) {
        projectText += ` Role: ${project.role}.`;
      }
      
      if (project.technical_details) {
        projectText += ` Technical details: ${JSON.stringify(project.technical_details)}.`;
      }
      
      if (project.key_achievements && project.key_achievements.length > 0) {
        projectText += ` Key achievements: ${project.key_achievements.join(", ")}.`;
      }
      
      if (project.learnings && project.learnings.length > 0) {
        projectText += ` Learnings: ${project.learnings.join(", ")}.`;
      }
      
      if (project.relevance_to_networking) {
        projectText += ` Networking relevance: ${project.relevance_to_networking}`;
      }
      
      chunks.push({
        id: `project-${idx}`,
        text: projectText,
        metadata: {
          title: project.name,
          type: "project",
          content: projectText,
        },
      });
    });

    // Goals - Immediate
    chunks.push({
      id: "goals-immediate",
      text: `Immediate goals: ${profileData.goals.immediate.join(", ")}`,
      metadata: {
        title: "Immediate Goals",
        type: "goals",
        content: `Immediate goals: ${profileData.goals.immediate.join(", ")}`,
      },
    });

    // Goals - Short term
    chunks.push({
      id: "goals-short-term",
      text: `Short-term goals: ${profileData.goals.short_term.join(", ")}`,
      metadata: {
        title: "Short-term Goals",
        type: "goals",
        content: `Short-term goals: ${profileData.goals.short_term.join(", ")}`,
      },
    });

    // Goals - Long term and Career Path
    chunks.push({
      id: "goals-long-term",
      text: `Long-term goals: ${profileData.goals.long_term.join(", ")}. Learning focus: ${profileData.goals.learning_focus.join(", ")}. Preferred roles: ${profileData.goals.preferred_roles.join(", ")}. Preferred industries: ${profileData.goals.preferred_industries.join(", ")}`,
      metadata: {
        title: "Long-term Goals and Career Path",
        type: "goals",
        content: `Long-term goals: ${profileData.goals.long_term.join(", ")}. Preferred roles: ${profileData.goals.preferred_roles.join(", ")}`,
      },
    });

    // Interview Preparation - Weakness
    chunks.push({
      id: "weakness",
      text: `Weakness: ${profileData.interview_preparation.weakness.description}. Mitigation: ${profileData.interview_preparation.weakness.mitigation}`,
      metadata: {
        title: "Weakness and Mitigation",
        type: "interview",
        content: `Weakness: ${profileData.interview_preparation.weakness.description}. Mitigation: ${profileData.interview_preparation.weakness.mitigation}`,
      },
    });

    console.log(`📊 Created ${chunks.length} content chunks\n`);

    // First, let's reset the database (optional - uncomment if needed)
    console.log("🗑️  Clearing existing vectors...");
    try {
      await index.reset();
      console.log("✅ Database cleared\n");
    } catch (error) {
      console.log("⚠️  Could not clear database (continuing anyway)\n");
    }

    // Upload vectors
    console.log("📤 Uploading vectors to Upstash...");
    
    for (const chunk of chunks) {
      await index.upsert([
        {
          id: chunk.id,
          data: chunk.text,
          metadata: chunk.metadata,
        },
      ]);
      console.log(`✅ Uploaded: ${chunk.id}`);
    }

    console.log(`\n🎉 Successfully populated database with ${chunks.length} vectors!`);

    // Verify
    const info = await index.info();
    console.log(`\n📊 Final vector count: ${info.vectorCount}`);

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

populateDatabase();
