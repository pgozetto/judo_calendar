import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const registerSchema = z.object({
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,30}$/),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72),
  termsAccepted: z.literal(true),
});

const attemptsByAddress = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function getRequestAddress(request: NextRequest) {
  return request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
}

function isRateLimited(address: string) {
  const now = Date.now();
  const current = attemptsByAddress.get(address);
  if (!current || current.resetAt <= now) {
    attemptsByAddress.set(address, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }

  current.count += 1;
  return current.count > MAX_ATTEMPTS;
}

function authErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("already registered") || normalized.includes("already exists")) {
    return "Este e-mail já está cadastrado.";
  }
  if (normalized.includes("password")) return "Use uma senha com pelo menos 8 caracteres.";
  return "Não foi possível criar sua conta agora. Confira os dados e tente novamente.";
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Origem da solicitação inválida." }, { status: 403 });
  }

  if (isRateLimited(getRequestAddress(request))) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." }, { status: 429 });
  }

  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Preencha os dados corretamente e aceite os termos." }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ code: "server_not_configured" }, { status: 503 });
  }

  try {
    const admin = createAdminClient();
    const { data: existingProfile, error: profileError } = await admin
      .from("profiles")
      .select("id")
      .eq("username", parsed.data.username)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: "Não foi possível validar o nome de usuário agora." }, { status: 503 });
    }
    if (existingProfile) {
      return NextResponse.json({ error: "Este nome de usuário já está em uso." }, { status: 409 });
    }

    const { error: createError } = await admin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        username: parsed.data.username,
        display_name: parsed.data.username,
      },
    });

    if (createError) {
      return NextResponse.json({ error: authErrorMessage(createError.message) }, { status: 409 });
    }

    return NextResponse.json({ created: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível criar sua conta agora. Tente novamente." }, { status: 503 });
  }
}
