import { redirect } from "next/navigation";

/** CAPA / 8D now lives inside Investigations. */
export default function CapaRedirectPage() {
  redirect("/quality/investigations");
}
