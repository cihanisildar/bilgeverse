import { NextRequest, NextResponse } from 'next/server';
import prisma, { prismaUnscoped } from '@/lib/prisma';
import { runAsOrg } from '@/lib/tenant-context';
import { normalizeOrgCode } from '@/lib/constants/tenant';
import bcrypt from 'bcryptjs';

// HERKESE AÇIK uç nokta: kayıt talebi oturum açmadan gönderilir. Çok kurumlu
// yapıda talebin hangi kuruma gideceği belirsiz olamaz, bu yüzden kurum kodu
// zorunludur ve kalan işlemler o kurum adına çalıştırılır.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgCode, username, email, password, firstName, lastName, requestedRole } = body;

    // Validate required fields
    if (!orgCode || !username || !email || !password || !firstName || !lastName || !requestedRole) {
      return NextResponse.json(
        { error: 'Kurum kodu dahil tüm alanlar zorunludur' },
        { status: 400 }
      );
    }

    const org = await prismaUnscoped.organization.findUnique({
      where: { code: normalizeOrgCode(orgCode) },
      select: { id: true, isActive: true },
    });

    if (!org || !org.isActive) {
      return NextResponse.json({ error: 'Geçersiz kurum kodu' }, { status: 404 });
    }

    return await runAsOrg(org.id, () => handleRegistration({
      username, email, password, firstName, lastName, requestedRole,
    }));
  } catch (error: any) {
    console.error('Registration request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleRegistration({
  username, email, password, firstName, lastName, requestedRole,
}: Record<string, any>) {
  {
    // Check if username or email already exists in users or registration requests
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username.toLowerCase() },
          { email: email.toLowerCase() }
        ],
      },
    });

    const existingRequest = await prisma.registrationRequest.findFirst({
      where: {
        OR: [
          { username: username.toLowerCase() },
          { email: email.toLowerCase() }
        ],
        status: 'PENDING',
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 409 }
      );
    }

    if (existingRequest) {
      return NextResponse.json(
        { error: 'A pending registration request already exists for this username or email' },
        { status: 409 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create registration request
    const registrationRequest = await prisma.registrationRequest.create({
      data: {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        requestedRole,
        status: 'PENDING',
      },
    });

    return NextResponse.json(
      {
        message: 'Registration request submitted successfully. Please wait for admin approval.',
        requestId: registrationRequest.id
      },
      { status: 201 }
    );
  }
}
