import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkIsAdmin } from '@/lib/server-auth';
import { hash } from 'bcryptjs';

// GET - Fetch all registration requests
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const isUserAdmin = await checkIsAdmin(request);
    if (!isUserAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch all registration requests
    const requests = await prisma.registrationRequest.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json({ requests }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching registration requests:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Process a registration request (approve/reject)
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is an admin
    const isUserAdmin = await checkIsAdmin(request);
    if (!isUserAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    const { requestId, action, rejectionReason } = data;
    
    if (!requestId || !action || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }
    
    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }
    
    // Find the registration request
    const registrationRequest = await prisma.registrationRequest.findUnique({
      where: { id: requestId }
    });
    
    if (!registrationRequest) {
      return NextResponse.json({ error: 'Registration request not found' }, { status: 404 });
    }
    
    // Handle based on action
    if (action === 'approve') {
      // Create a new user from the registration request
      const newUser = await prisma.user.create({
        data: {
          username: registrationRequest.username,
          email: registrationRequest.email,
          password: registrationRequest.password, // Password should already be hashed
          firstName: registrationRequest.firstName || null,
          lastName: registrationRequest.lastName || null,
          role: registrationRequest.requestedRole,
        }
      });
      
      // Update the registration request status
      await prisma.registrationRequest.update({
        where: { id: requestId },
        data: { 
          status: 'APPROVED'
        }
      });
      
      return NextResponse.json({ 
        message: 'Registration request approved successfully',
        user: { 
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role
        }
      }, { status: 200 });
    } else {
      // Reject the registration request
      await prisma.registrationRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          rejectionReason
        }
      });
      
      return NextResponse.json({ 
        message: 'Registration request rejected successfully'
      }, { status: 200 });
    }
  } catch (error: any) {
    console.error('Error processing registration request:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 