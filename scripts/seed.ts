import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// User data
const users = [
  {
    username: 'admin.user',
    email: 'admin@example.com',
    password: 'admin123',
    role: UserRole.ADMIN,
    firstName: 'Admin',
    lastName: 'User',
    bio: 'System administrator managing the educational platform',
  },
  {
    username: 'tutor.smith',
    email: 'tutor@example.com',
    password: 'tutor123',
    role: UserRole.TUTOR,
    firstName: 'John',
    lastName: 'Smith',
    specialization: 'Mathematics and Science',
    bio: 'Experienced tutor specializing in STEM subjects',
    phone: '+1234567890',
  },
  {
    username: 'student.doe',
    email: 'student@example.com',
    password: 'student123',
    role: UserRole.STUDENT,
    firstName: 'Jane',
    lastName: 'Doe',
    points: 150,
    experience: 75,
    bio: 'Eager student looking to learn and grow',
  },
] as const;

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function seedUsers() {
  try {
    console.log('Starting to seed users...');

    const createdUsers: any[] = [];

    // Create or update users
    for (const userData of users) {
      console.log(`Processing ${userData.role.toLowerCase()}: ${userData.username}`);

      const hashedPassword = await hashPassword(userData.password);

      // Check if user already exists by email or username
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: userData.email },
            { username: userData.username },
          ],
        },
      });

      if (existingUser) {
        console.log(`${userData.role} user found, updating...`);
        
        const updatedUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName,
            specialization: (userData as any).specialization,
            bio: userData.bio,
            phone: (userData as any).phone,
            points: (userData as any).points || existingUser.points,
            experience: (userData as any).experience || existingUser.experience,
            // Only update password if explicitly requested
            ...(process.env.RESET_PASSWORD === 'true' ? { password: hashedPassword } : {}),
          },
        });
        
        createdUsers.push(updatedUser);
        console.log(`${userData.role} user updated successfully: ${updatedUser.username}`);
      } else {
        // Create new user
        const newUser = await prisma.user.create({
          data: {
            username: userData.username,
            email: userData.email,
            password: hashedPassword,
            role: userData.role,
            firstName: userData.firstName,
            lastName: userData.lastName,
            specialization: (userData as any).specialization,
            bio: userData.bio,
            phone: (userData as any).phone,
            points: (userData as any).points || 0,
            experience: (userData as any).experience || 0,
          },
        });
        
        createdUsers.push(newUser);
        console.log(`${userData.role} user created successfully: ${newUser.username}`);
      }
    }

    // Find the tutor and student for relationship setup
    const tutor = createdUsers.find(user => user.role === UserRole.TUTOR);
    const student = createdUsers.find(user => user.role === UserRole.STUDENT);

    if (tutor && student) {
      console.log('Setting up tutor-student relationships...');

      // Create or update classroom for tutor
      let classroom = await prisma.classroom.findUnique({
        where: { tutorId: tutor.id },
      });

      if (!classroom) {
        classroom = await prisma.classroom.create({
          data: {
            name: `${tutor.firstName}'s Classroom`,
            description: `Classroom managed by ${tutor.firstName} ${tutor.lastName}`,
            tutorId: tutor.id,
          },
        });
        console.log(`Classroom created: ${classroom.name}`);
      }

      // Assign student to tutor and classroom
      await prisma.user.update({
        where: { id: student.id },
        data: {
          tutorId: tutor.id,
          studentClassroomId: classroom.id,
        },
      });

      console.log(`Student ${student.username} assigned to tutor ${tutor.username} and classroom ${classroom.name}`);
    }

    console.log('\n✅ Seeding completed successfully!');
    console.log('\nCreated users:');
    console.log('- Admin: admin.user (admin@example.com) - password: admin123');
    console.log('- Tutor: tutor.smith (tutor@example.com) - password: tutor123');
    console.log('- Student: student.doe (student@example.com) - password: student123');
    console.log('\nNote: Set RESET_PASSWORD=true environment variable to reset passwords for existing users.');

  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedUsers().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
}); 