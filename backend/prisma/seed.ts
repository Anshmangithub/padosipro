import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Modelled on the kind of household "lifestyle management" catalogue described
// in the assignment brief. Wording is original, not copied from any live site.
const TASKS: Array<{ category: string; name: string; description: string }> = [
  // Home Cleaning & Upkeep
  {
    category: 'Home Cleaning & Upkeep',
    name: 'Deep House Cleaning',
    description: 'Full-home deep clean covering kitchen, bathrooms, bedrooms and living areas.',
  },
  {
    category: 'Home Cleaning & Upkeep',
    name: 'Kitchen Deep Clean',
    description: 'Degreasing, chimney filter wash and cabinet cleaning for a spotless kitchen.',
  },
  {
    category: 'Home Cleaning & Upkeep',
    name: 'Bathroom Deep Clean',
    description: 'Tile scrubbing, descaling and sanitisation for every bathroom in your home.',
  },
  {
    category: 'Home Cleaning & Upkeep',
    name: 'Sofa & Carpet Shampooing',
    description: 'Professional shampoo wash to lift stains, dust and odours from upholstery.',
  },
  {
    category: 'Home Cleaning & Upkeep',
    name: 'Pest Control Treatment',
    description: 'Cockroach, ant and termite treatment to keep your home pest-free.',
  },
  // Repairs & Maintenance
  {
    category: 'Repairs & Maintenance',
    name: 'Electrician Visit',
    description: 'Wiring faults, switchboard issues and fixture repairs by a vetted electrician.',
  },
  {
    category: 'Repairs & Maintenance',
    name: 'Plumber Visit',
    description: 'Leak fixes, tap replacements and pipe repairs from a trusted plumber.',
  },
  {
    category: 'Repairs & Maintenance',
    name: 'AC Service & Repair',
    description: 'Gas top-up, filter cleaning and cooling checks to keep your AC running well.',
  },
  {
    category: 'Repairs & Maintenance',
    name: 'Appliance Repair',
    description: 'Diagnosis and repair for washing machines, refrigerators and other appliances.',
  },
  {
    category: 'Repairs & Maintenance',
    name: 'Carpentry & Furniture Fixes',
    description: 'Door, hinge, lock and furniture repairs handled by a skilled carpenter.',
  },
  // Bills & Documentation
  {
    category: 'Bills & Documentation',
    name: 'Utility Bill Payments',
    description: 'We pay your electricity, water and gas bills on time, every month.',
  },
  {
    category: 'Bills & Documentation',
    name: 'Society Maintenance Payment',
    description: 'On-time payment of your apartment or society maintenance dues.',
  },
  {
    category: 'Bills & Documentation',
    name: 'Document Collection & Courier',
    description: 'Pickup and drop-off of important documents so you never have to queue.',
  },
  {
    category: 'Bills & Documentation',
    name: 'Government Form Assistance',
    description: 'Help filling out and submitting routine government forms and applications.',
  },
  {
    category: 'Bills & Documentation',
    name: 'Insurance Premium Reminders',
    description: 'Renewal tracking and on-time payment so a policy never lapses.',
  },
  // Errands & Deliveries
  {
    category: 'Errands & Deliveries',
    name: 'Grocery Shopping',
    description: 'Weekly grocery runs based on the list you share with your Lifestyle Manager.',
  },
  {
    category: 'Errands & Deliveries',
    name: 'Medicine Pickup',
    description: 'Same-day pickup and delivery of prescribed medicines from the pharmacy.',
  },
  {
    category: 'Errands & Deliveries',
    name: 'Courier & Parcel Drop-off',
    description: 'We collect or drop off parcels and packages on your behalf.',
  },
  {
    category: 'Errands & Deliveries',
    name: 'Vehicle Fuel & Service Pickup',
    description: 'Fuel top-ups and drop-off/pickup coordination with the service centre.',
  },
  {
    category: 'Errands & Deliveries',
    name: 'Gift & Flower Delivery',
    description: 'Same-day delivery of gifts and flowers for birthdays and special occasions.',
  },
  // Care & Companionship
  {
    category: 'Care & Companionship',
    name: 'Elderly Companion Visits',
    description: 'Regular check-in visits and company for elderly family members.',
  },
  {
    category: 'Care & Companionship',
    name: 'Pet Walking',
    description: 'Daily walks for your pet, scheduled around your routine.',
  },
  {
    category: 'Care & Companionship',
    name: 'Pet Grooming Booking',
    description: 'We book and coordinate a professional groomer for your pet.',
  },
  {
    category: 'Care & Companionship',
    name: 'Child Pickup/Drop Coordination',
    description: 'Reliable coordination for school pickup and drop-off on busy days.',
  },
];

async function main() {
  console.log(`Seeding ${TASKS.length} tasks across ${new Set(TASKS.map((t) => t.category)).size} categories...`);

  for (const task of TASKS) {
    await prisma.task.upsert({
      where: { name_category: { name: task.name, category: task.category } },
      update: { description: task.description },
      create: task,
    });
  }

  console.log('Seed complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
