import { createClient } from "@/lib/supabase/server";
import EmbedClient from "./EmbedClient";

export default async function EmbedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const companyId = user!.id;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://estimato-xi.vercel.app";

  return <EmbedClient companyId={companyId} appUrl={appUrl} />;
}
