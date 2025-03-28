// Interface for a message block
interface MessageBlock {
  id: string;
  content: string;
  delay: number;
}

import { notFound } from "next/navigation";
import { getAutomationById } from "@/app/actions/automation-actions";
import AutomationDetail from "./automation-detail";

interface AutomationPageProps {
  params: {
    id: string;
  };
}

// Server-side function to fetch automation data
export async function getServerSideProps({ params }: AutomationPageProps) {
  const { id } = params;

  // Use the server action to get the automation by ID
  const automation = await getAutomationById(id);

  // If automation not found, show 404 page
  if (!automation) {
    notFound();
  }

  return { props: { automation } };
}

export default function AutomationPage({ automation }: { automation: any }) {
  return <AutomationDetail automation={automation} />;
}
