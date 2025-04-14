import prisma from './prisma';
import { Prisma, UserRole } from '@prisma/client';

// Middleware to automatically create a classroom for new tutors
export async function createClassroomForTutor(params: Prisma.MiddlewareParams, next: (params: Prisma.MiddlewareParams) => Promise<any>) {
  // Only run this middleware for User model operations
  if (params.model === 'User') {
    // Handle create operations
    if (params.action === 'create') {
      const data = params.args.data as any;
      // If the user being created is a tutor
      if (data.role === UserRole.TUTOR) {
        // Let the create operation complete first
        const result = await next(params);
        
        // Then create a classroom for the tutor
        await prisma.classroom.create({
          data: {
            name: `${result.firstName || result.username}'in Sınıfı`,
            description: `${result.firstName || result.username} öğretmen ve öğrencileri`,
            tutorId: result.id
          }
        });

        return result;
      }
    }
    
    // Handle update operations
    if (params.action === 'update' || params.action === 'updateMany') {
      const data = params.args.data as any;
      // If the user's role is being updated to tutor
      if (data.role === UserRole.TUTOR) {
        // Let the update operation complete first
        const result = await next(params);
        
        // Check if the tutor already has a classroom
        const existingClassroom = await prisma.classroom.findUnique({
          where: { tutorId: params.args.where.id }
        });

        // If no classroom exists, create one
        if (!existingClassroom) {
          const tutor = await prisma.user.findUnique({
            where: { id: params.args.where.id }
          });

          if (tutor) {
            await prisma.classroom.create({
              data: {
                name: `${tutor.firstName || tutor.username}'in Sınıfı`,
                description: `${tutor.firstName || tutor.username} öğretmen ve öğrencileri`,
                tutorId: tutor.id
              }
            });
          }
        }

        return result;
      }
    }
  }

  return next(params);
} 