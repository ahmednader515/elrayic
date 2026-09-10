import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import {
  ABROAD_LOCATION,
  isValidCollege,
  isValidCollegeType,
  isValidGovernorate,
  isValidStudyLocation,
} from "@/lib/academic";

export async function POST(req: Request) {
  try {
    const {
      fullName,
      phoneNumber,
      grade,
      division,
      studyType,
      governorate,
      password,
      confirmPassword,
    } = await req.json();

    if (!fullName || !phoneNumber || !password || !confirmPassword) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (!grade || !isValidCollege(grade)) {
      return new NextResponse("Invalid college", { status: 400 });
    }

    if (!division || !isValidCollegeType(division)) {
      return new NextResponse("Invalid college type", { status: 400 });
    }

    if (!studyType || !isValidStudyLocation(studyType)) {
      return new NextResponse("Invalid study location", { status: 400 });
    }

    const resolvedGovernorate = studyType === ABROAD_LOCATION ? ABROAD_LOCATION : governorate;

    if (!resolvedGovernorate || !isValidGovernorate(resolvedGovernorate)) {
      return new NextResponse("Invalid governorate", { status: 400 });
    }

    if (password !== confirmPassword) {
      return new NextResponse("Passwords do not match", { status: 400 });
    }

    const existingUser = await db.user.findFirst({
      where: { phoneNumber },
    });

    if (existingUser) {
      return new NextResponse("Phone number already exists", { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.user.create({
      data: {
        fullName,
        phoneNumber,
        grade,
        division,
        studyType,
        governorate: resolvedGovernorate,
        hashedPassword,
        role: "USER",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[REGISTER]", error);

    if (error instanceof Error && (
      error.message.includes("does not exist") ||
      error.message.includes("P2021") ||
      error.message.includes("table")
    )) {
      return new NextResponse("Database not initialized. Please run database migrations.", { status: 503 });
    }

    return new NextResponse("Internal Error", { status: 500 });
  }
}
