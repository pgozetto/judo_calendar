import { NextResponse, type NextRequest } from "next/server";
import { isSameOrigin } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type StorageBucket = ReturnType<ReturnType<typeof createAdminClient>["storage"]["from"]>;

// O Storage lista uma pasta por vez; mídias de treino ficam em {usuário}/{data}/arquivo.
async function listFilesRecursively(bucket: StorageBucket, folder: string): Promise<string[]> {
  const { data, error } = await bucket.list(folder, { limit: 1000 });
  if (error) throw error;
  const nested = await Promise.all(data.map((item) => item.id
    ? Promise.resolve([`${folder}/${item.name}`])
    : listFilesRecursively(bucket, `${folder}/${item.name}`)));
  return nested.flat();
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Origem da solicitação inválida." }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }

  try {
    const admin = createAdminClient();

    // Encerra a cobrança recorrente antes de apagar a conta.
    const { data: subscription } = await admin.from("subscriptions").select("provider_subscription_id,status").eq("user_id", userId).maybeSingle();
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (subscription?.provider_subscription_id && subscription.status === "authorized") {
      if (!accessToken) {
        return NextResponse.json({ error: "Cancele sua assinatura antes de excluir a conta." }, { status: 409 });
      }
      const cancelResponse = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(subscription.provider_subscription_id)}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (!cancelResponse.ok) {
        return NextResponse.json({ error: "Não foi possível cancelar a assinatura. Tente novamente." }, { status: 502 });
      }
    }

    for (const bucketName of ["avatars", "training-media"]) {
      const bucket = admin.storage.from(bucketName);
      const files = await listFilesRecursively(bucket, userId);
      if (files.length > 0) {
        const { error: removeError } = await bucket.remove(files);
        if (removeError) {
          return NextResponse.json({ error: "Não foi possível remover os arquivos da conta." }, { status: 500 });
        }
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
