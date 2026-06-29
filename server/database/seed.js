import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../config/db.js";

const departments = ["Computer Science", "Business", "Engineering", "Arts", "Science"];
const categories = ["Technology", "Culture", "Sports", "Career", "Academic"];
const firstNames = ["Aarav", "Diya", "Kabir", "Meera", "Vihaan", "Anaya", "Arjun", "Isha", "Reyansh", "Tara"];
const lastNames = ["Sharma", "Patel", "Singh", "Rao", "Gupta", "Nair", "Mehta", "Kapoor", "Joshi", "Verma"];

const connection = await db.getConnection();
try {
  await connection.beginTransaction();
  await connection.query("SET FOREIGN_KEY_CHECKS=0");
  for (const table of ["audit_logs","certificates","notifications","claims","lost_items","announcements","post_likes","comments","posts","club_members","clubs","registrations","events","users"]) {
    await connection.query(`TRUNCATE TABLE ${table}`);
  }
  await connection.query("SET FOREIGN_KEY_CHECKS=1");
  const hash = await bcrypt.hash("Campus@123", 12);
  await connection.query("INSERT INTO users(name,email,password_hash,role,department) VALUES (?,?,?,?,?)", ["Campus Admin", "admin@campushub.edu", hash, "admin", "Administration"]);
  for (let i = 1; i <= 100; i++) {
    const name = `${firstNames[(i - 1) % 10]} ${lastNames[Math.floor((i - 1) / 10)]}`;
    await connection.query("INSERT INTO users(name,email,password_hash,role,department) VALUES (?,?,?,?,?)", [name, `student${i}@campushub.edu`, hash, "student", departments[i % departments.length]]);
  }
  for (let i = 1; i <= 20; i++) await connection.query("INSERT INTO users(name,email,password_hash,role,department) VALUES (?,?,?,?,?)", [`Dr. ${firstNames[i % 10]} ${lastNames[i % 10]}`, `faculty${i}@campushub.edu`, hash, "faculty", departments[i % departments.length]]);
  const clubNames = ["Code Collective","Debate Society","Lens Club","Eco Circle","Robotics Guild","Music Ensemble","Drama House","Sports Council","Literary Circle","Entrepreneurs Cell"];
  for (let i = 0; i < 10; i++) await connection.query("INSERT INTO clubs(name,description,department,faculty_id,meeting_schedule) VALUES (?,?,?,?,?)", [clubNames[i], `A welcoming community for students interested in ${clubNames[i].toLowerCase()}.`, departments[i % 5], 102 + i, "Fridays at 4:00 PM"]);
  const eventNames = ["AI Builders Summit","Open Mic Evening","Intercollege Hackathon","Career Launch Lab","Design Thinking Workshop","Campus Sports Meet","Research Showcase","Cultural Night","Startup Demo Day","Photography Walk"];
  for (let i = 1; i <= 50; i++) {
    const starts = new Date(Date.now() + (i - 10) * 86400000);
    const deadline = new Date(starts.getTime() - 2 * 86400000);
    await connection.query("INSERT INTO events(title,description,venue,starts_at,category,banner_url,max_capacity,registration_deadline,organizer_id,department,status) VALUES (?,?,?,?,?,?,?,?,?,?,?)", [`${eventNames[(i - 1) % 10]} ${Math.ceil(i / 10)}`, "Connect, learn, and build alongside curious people from across campus.", `Campus Hall ${1 + (i % 5)}`, starts, categories[i % 5], "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80", 80 + i, deadline, 102 + (i % 20), departments[i % 5], "published"]);
  }
  for (let i = 1; i <= 150; i++) await connection.query("INSERT INTO registrations(event_id,user_id,status,attended) VALUES (?,?,?,?)", [1 + (i % 50), 2 + (i % 100), "registered", i % 3 === 0]);
  for (let i = 1; i <= 100; i++) await connection.query("INSERT INTO club_members(club_id,user_id,status) VALUES (?,?,?)", [1 + (i % 10), 2 + (i % 100), "active"]);
  const items = ["Black wallet","Silver water bottle","Student ID card","Wireless earbuds","Blue backpack","House keys","Scientific calculator","Reading glasses"];
  for (let i = 1; i <= 40; i++) await connection.query("INSERT INTO lost_items(title,description,category,location,item_date,item_type,status,reporter_id) VALUES (?,?,?,?,?,?,?,?)", [`${items[i % 8]} ${i}`, "Distinctive personal item reported through the campus community.", ["Accessories","Electronics","Documents"][i % 3], `Block ${String.fromCharCode(65 + i % 5)}`, new Date(Date.now() - i * 86400000), i % 2 ? "lost" : "found", "open", 2 + (i % 100)]);
  for (let i = 1; i <= 50; i++) await connection.query("INSERT INTO notifications(user_id,type,title,message,link) VALUES (?,?,?,?,?)", [2 + (i % 100), "announcement", "Campus update", "There is something new waiting for you on CampusHub.", "/"]);
  await connection.commit();
  console.log("Seeded: 100 students, 20 faculty, 10 clubs, 50 events, 150 registrations, 40 lost items, 50 notifications.");
} catch (error) {
  await connection.rollback();
  console.error(error);
  process.exitCode = 1;
} finally {
  connection.release();
  await db.end();
}
