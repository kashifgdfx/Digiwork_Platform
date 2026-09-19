import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';

export async function GET() {
  try {
    console.log('🧪 Testing MongoDB connection...');
    const mongoose = await dbConnect();
    
    return NextResponse.json({
      success: true,
      message: 'MongoDB connection successful',
      // Optional chaining aur fallback lagaya hai taaki TypeScript error na de
      database: mongoose.connection.db?.databaseName || 'unknown',
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
    });
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}