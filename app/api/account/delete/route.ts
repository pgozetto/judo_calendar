import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const avatarStorage = admin.storage.from("avatars");
    const { data: avatarFiles, error: listError } = await avatarStorage.list(userId, { limit: 1000 });

    if (listError) {
      return NextResponse.json({ error: "Não foi possível preparar a exclusão da conta." }, { status: 500 });
    }

    if (avatarFiles.length > 0) {
      const { error: removeError } = await avatarStorage.remove(avatarFiles.map((file) => `${userId}/${file.name}`));
      if (removeError) {
        return NextResponse.json({ error: "Não foi possível remover os arquivos da conta." }, { status: 500 });
      }
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      return NextResponse.json({ error: "Não foi possível excluir sua conta agora." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível excluir sua conta agora." }, { status: 500 });
  }
}
