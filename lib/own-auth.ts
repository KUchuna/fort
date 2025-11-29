import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = new TextEncoder().encode(process.env.MYSPACE_PASSWORD); 

export async function createSession() {
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET_KEY);

  const cookieStore = await cookies();
  cookieStore.set('myspace_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
}

export async function verifySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('myspace_session')?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload.role === 'admin';
  } catch (error) {
    return false;
  }
}


export async function createChatSession() {
  const token = await new SignJWT({ role: 'guest' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET_KEY);

  const cookieStore = await cookies();
  
  cookieStore.set('chat_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
}

export async function verifyChatAccess() {
  const cookieStore = await cookies();
  
  const adminToken = cookieStore.get('myspace_session')?.value;
  if (adminToken) {
    try {
        const { payload } = await jwtVerify(adminToken, SECRET_KEY);
        if (payload.role === 'admin') return true;
    } catch (e) {}
  }

  const chatToken = cookieStore.get('chat_session')?.value;
  if (!chatToken) return false;

  try {
    const { payload } = await jwtVerify(chatToken, SECRET_KEY);
    return payload.role === 'guest';
  } catch (error) {
    return false;
  }
}