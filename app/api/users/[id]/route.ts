import { NextRequest, NextResponse } from 'next/server';
import { updateUser, deleteUser } from '@/actions/users';
import { getUserById } from '@/actions/users';

interface Props {
  params: Promise<{ id: string }>;
}

// GET /api/users/:id – get user by id
export async function GET(
  req: NextRequest,
  { params }: Props
) {
  try {
    const { id } = await params;
    const user = await getUserById(id);

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    console.error('GET /api/users/[id] error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'FAILED_TO_FETCH_USER', message: error.message || 'Failed to fetch user' } },
      { status: 500 }
    );
  }
}


// PATCH /api/users/:id – update user
export async function PATCH(
  req: NextRequest,
  { params }: Props
) {
  try {
    const body = await req.json();
    const {id} = await params

    const updatedUser = await updateUser(id, body);

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error: any) {
    console.error('PATCH /api/users/[id] error:', error);
    const status = error.message === 'User not found' ? 404
                 : error.message === 'Email already exists' || error.message === 'Username already exists' ? 409
                 : 400;
    return NextResponse.json(
      { success: false, error: { code: error.message.replace(/\s+/g, '_').toUpperCase(), message: error.message } },
      { status }
    );
  }
}

// DELETE /api/users/:id – soft delete user
export async function DELETE(
  req: NextRequest,
  { params }: Props
) {
  try {
        const {id} = await params
    const deletedUser = await deleteUser(id);

    return NextResponse.json({ success: true, data: deletedUser });
  } catch (error: any) {
    console.error('DELETE /api/users/[id] error:', error);
    const status = error.message === 'User not found' ? 404 : 400;
    return NextResponse.json(
      { success: false, error: { code: error.message.replace(/\s+/g, '_').toUpperCase(), message: error.message } },
      { status }
    );
  }
}
