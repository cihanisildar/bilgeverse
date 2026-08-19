import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import { getActivePeriod } from "@/lib/periods";

// Aktif dönem artık kuruma göre değişiyor: build sırasında önbelleğe alınamaz,
// her istekte oturumdaki kuruma göre çözülmelidir.
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Bu rota middleware matcher'ında değil, dolayısıyla kendi kapısını kendisi
  // kurmalı. Oturum yoksa tenant bağlamı da yoktur ve aşağıdaki sorgu
  // MissingTenantContextError fırlatır; o hata mesajı istemciye dönerse iç
  // ayrıntı sızar. Onun yerine düz 401.
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const activePeriod = await getActivePeriod();

    if (!activePeriod) {
      return NextResponse.json(
        { error: "No active period found" },
        { status: 404 }
      );
    }

    return NextResponse.json(activePeriod);
  } catch (error) {
    // Hata ayrıntısı sunucu günlüğünde kalır; istemciye genel mesaj döner.
    console.error("Error fetching active period:", error);
    return NextResponse.json(
      { error: "Aktif dönem alınamadı" },
      { status: 500 }
    );
  }
}
