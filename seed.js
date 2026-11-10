/**
 * Campus Connect — demo data seeder (Node.js edition)
 * Run with: npm run seed
 *
 * Populates the database with categories, demo accounts, sample listings,
 * a conversation/messages thread, campus events, an errand request, and a
 * couple of notifications — so the app looks alive for a demo/presentation
 * instead of empty.
 */

const {
  sequelize, User, Category, Listing, ListingImage, Conversation, Message,
  Transaction, Review, Event, ErrandRequest, pushNotification,
} = require("./models");

const { CATEGORY_STYLE, slugify } = require("./scripts/generate-demo-images");

const CATEGORIES = [
  "Books", "Electronics", "Furniture", "Hostel Essentials", "Clothing",
  "Sports", "Lab Equipment", "Stationery", "Bicycles", "Appliances",
  "Notes & Study Material", "Other",
];

async function seed() {
  console.log("Syncing database schema (force: true — this wipes existing data)...");
  await sequelize.sync({ force: true });

  console.log("Creating categories...");
  const categories = {};
  for (const name of CATEGORIES) {
    categories[name] = await Category.create({ name });
  }

  console.log("Creating demo accounts...");
  const admin = User.build({
    name: "Admin User", email: "admin@cuk.ac.in", role: "admin",
    department: "IT Services", phone: "9900000001", isVerified: true,
  });
  admin.setPassword("Admin@123");
  await admin.save();

  const student = User.build({
    name: "Aisha Khan", email: "student@cuk.ac.in", role: "student",
    department: "Computer Science", phone: "9900000002", isVerified: true,
    bio: "3rd year CS student. Selling old textbooks and gadgets I no longer need!",
  });
  student.setPassword("Student@123");
  await student.save();

  const rohan = User.build({
    name: "Rohan Verma", email: "rohan@cuk.ac.in", role: "student",
    department: "Mechanical Engineering", phone: "9900000003", isVerified: true,
  });
  rohan.setPassword("Student@123");
  await rohan.save();

  const priya = User.build({
    name: "Priya Nair", email: "priya@cuk.ac.in", role: "faculty",
    department: "Physics", phone: "9900000004", isVerified: true,
    bio: "Assistant Professor, Physics Department.",
  });
  priya.setPassword("Student@123");
  await priya.save();

  const sam = User.build({
    name: "Sam Fernandes", email: "sam@cuk.ac.in", role: "staff",
    department: "Hostel Administration", phone: "9900000005", isVerified: false,
  });
  sam.setPassword("Student@123");
  await sam.save();

  console.log("Creating sample listings...");
  const listingsData = [
    {
      seller: student, title: "Data Structures Textbook (3rd Edition)",
      description: "Cormen's Introduction to Algorithms — lightly used, no torn pages, minimal highlighting. Great for DSA prep.",
      category: "Books", transactionType: "sell", price: 450, condition: "Good", location: "CS Department",
    },
    {
      seller: student, title: "HP Pavilion Laptop (i5, 8GB RAM)",
      description: "2 years old, works perfectly. Selling because I upgraded. Comes with charger and a laptop sleeve.",
      category: "Electronics", transactionType: "sell", price: 28000, condition: "Good", location: "Girls Hostel Block C",
    },
    {
      seller: rohan, title: "Study Table with Drawer",
      description: "Sturdy wooden study table, great for hostel rooms. Minor scratches but very functional.",
      category: "Furniture", transactionType: "sell", price: 1200, condition: "Fair", location: "Boys Hostel Block A",
    },
    {
      seller: rohan, title: "Ergonomic Office Chair",
      description: "Comfortable mesh-back chair, adjustable height. Perfect for long study sessions.",
      category: "Furniture", transactionType: "rent", price: 150, condition: "Like New", location: "Boys Hostel Block A",
    },
    {
      seller: priya, title: "Mini Refrigerator (45L)",
      description: "Compact fridge, ideal for hostel rooms. Barely used, moving out so must sell quickly.",
      category: "Appliances", transactionType: "sell", price: 3500, condition: "Like New", location: "Faculty Quarters",
    },
    {
      seller: student, title: "Hero Sprint Bicycle",
      description: "Single-speed bicycle, great for getting around campus. New tires fitted last month.",
      category: "Bicycles", transactionType: "sell", price: 2200, condition: "Good", location: "Main Gate Parking",
    },
    {
      seller: rohan, title: "Lab Coat (Size L)",
      description: "White lab coat for chemistry/mechanical labs, washed and ready to use.",
      category: "Lab Equipment", transactionType: "sell", price: 200, condition: "Good", location: "Mechanical Block",
    },
    {
      seller: student, title: "Scientific Calculator (Casio fx-991ES)",
      description: "Works perfectly, all functions tested. Essential for engineering coursework.",
      category: "Stationery", transactionType: "sell", price: 350, condition: "Good", location: "CS Department",
    },
    {
      seller: rohan, title: "Engineering Drawing Kit (Full Set)",
      description: "Complete drafter kit with compass, scales, and set squares. Used for one semester only.",
      category: "Stationery", transactionType: "exchange", price: 0, condition: "Like New", location: "Mechanical Block",
      exchangePreference: "Looking for a scientific calculator or lab coat",
    },
    {
      seller: priya, title: "Hostel Mattress (Single, 4 inch)",
      description: "Comfortable foam mattress, no stains, recently sanitized. Selling as I'm moving to a furnished flat.",
      category: "Hostel Essentials", transactionType: "sell", price: 900, condition: "Good", location: "Faculty Quarters",
    },
    {
      seller: student, title: "Bluetooth Speaker (JBL Clip 3)",
      description: "Portable speaker with great bass, battery lasts ~8 hours. Barely used.",
      category: "Electronics", transactionType: "sell", price: 1500, condition: "Like New", location: "Girls Hostel Block C",
    },
    {
      seller: rohan, title: "Badminton Racket Set (2 rackets + shuttlecocks)",
      description: "Yonex racket pair with a box of shuttlecocks, great condition, used only a few times.",
      category: "Sports", transactionType: "sell", price: 800, condition: "Good", location: "Sports Complex",
    },
  ];

  const listings = [];
  for (const item of listingsData) {
    const listing = await Listing.create({
      sellerId: item.seller.id,
      title: item.title,
      description: item.description,
      categoryId: categories[item.category].id,
      transactionType: item.transactionType,
      price: item.price,
      condition: item.condition,
      location: item.location,
      exchangePreference: item.exchangePreference || null,
      status: "active",
    });
    // Attach a category placeholder image so listings show a photo instead
    // of the empty box icon. Swap these out any time for real photos by
    // editing the listing in the UI (Edit Listing > Add More Photos).
    if (CATEGORY_STYLE[item.category]) {
      await ListingImage.create({
        listingId: listing.id,
        imagePath: `category-${slugify(item.category)}.svg`,
      });
    }
    listings.push(listing);
  }

  console.log("Creating a sample conversation + messages...");
  const convo = await Conversation.create({
    listingId: listings[0].id, user1Id: rohan.id, user2Id: student.id,
  });
  await Message.create({ conversationId: convo.id, senderId: rohan.id, message: "Hi! Is the DSA textbook still available?", isRead: true });
  await Message.create({ conversationId: convo.id, senderId: student.id, message: "Yes it is! Barely used, happy to meet near the CS block.", isRead: true });
  await Message.create({ conversationId: convo.id, senderId: rohan.id, message: "Perfect, would tomorrow evening work for you?", isRead: false });

  console.log("Creating a sample completed transaction + review...");
  const completedTxn = await Transaction.create({
    listingId: listings[7].id, buyerId: rohan.id, sellerId: student.id,
    transactionType: "sell", status: "completed", buyerConfirmed: true, sellerConfirmed: true,
    completedAt: new Date(),
  });
  await Review.create({
    transactionId: completedTxn.id, reviewerId: rohan.id, reviewedUserId: student.id,
    rating: 5, comment: "Great seller, calculator was exactly as described. Smooth handoff!",
  });
  student.rating = 5;
  student.ratingCount = 1;
  await student.save();

  console.log("Creating a pending transaction request...");
  await Transaction.create({
    listingId: listings[1].id, buyerId: priya.id, sellerId: student.id,
    transactionType: "sell", status: "pending",
  });
  listings[1].status = "reserved";
  await listings[1].save();

  console.log("Creating campus events...");
  const today = new Date();
  function daysFromNow(n) {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }
  await Event.create({
    title: "Annual Campus Fest — Utsav 2026", description: "Three days of music, food stalls, and a giant flea market. Bring your old gadgets to sell!",
    category: "Campus Fest", date: daysFromNow(12), time: "10:00 AM", location: "Main Ground",
    organizer: "Student Council", createdBy: admin.id,
  });
  await Event.create({
    title: "End-of-Semester Flea Market", description: "Clear out your hostel room — sell textbooks, furniture, and electronics before the break.",
    category: "Flea Market", date: daysFromNow(5), time: "4:00 PM", location: "Central Quad",
    organizer: "Campus Connect Team", createdBy: admin.id,
  });
  await Event.create({
    title: "CS Department Swap Meet", description: "Trade lab equipment, old assignments references, and study notes with fellow CS students.",
    category: "Swap Meet", date: daysFromNow(3), time: "2:00 PM", location: "CS Department Lobby",
    organizer: "CS Student Association", createdBy: admin.id,
  });
  await Event.create({
    title: "Founders' Day Sale", description: "A campus-wide student sale to celebrate Founders' Day — special discounts from student sellers.",
    category: "Student Sale", date: daysFromNow(-4), time: "11:00 AM", location: "Main Ground",
    organizer: "Alumni Association", createdBy: admin.id,
  });

  console.log("Creating a sample errand request...");
  await ErrandRequest.create({
    requesterId: student.id, title: "Bring a laptop charger from XYZ Electronics",
    description: "My charger stopped working. Any brand-compatible 65W charger would help!",
    pickupLocation: "Kalaburagi City", destination: "Girls Hostel Block C",
    date: daysFromNow(2), reward: "₹100 + cost of item", status: "open",
  });

  console.log("Creating sample notifications...");
  await pushNotification(student.id, "Welcome to Campus Connect!", "Your university email is verified. Explore the marketplace!", "system");
  await pushNotification(student.id, "New request on your listing", `${priya.name} requested to buy "${listings[1].title}".`, "transaction", "/transactions");
  await pushNotification(rohan.id, "New message", `${student.name} sent you a message.`, "message", `/messages/${convo.id}`);

  console.log("\nSeed complete!");
  console.log("----------------------------------------------------");
  console.log("Demo accounts:");
  console.log("  Student : student@cuk.ac.in / Student@123");
  console.log("  Admin   : admin@cuk.ac.in   / Admin@123");
  console.log("  (also seeded: rohan@cuk.ac.in, priya@cuk.ac.in, sam@cuk.ac.in — all password Student@123)");
  console.log("----------------------------------------------------");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
