// app/api/auth/sign-up/email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password, username, phoneNumber } = await request.json();

    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: username || email.split("@")[0],
        fullName: username || email.split("@")[0],
        image: "",
        phoneNumber: phoneNumber ?? "",
      },
    });

    if (!result.token) {
      return NextResponse.json({ error: result.token }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Sign up error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
