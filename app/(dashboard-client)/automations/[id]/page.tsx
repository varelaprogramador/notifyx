"use client";

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

export default async function AutomationPage({ params }: AutomationPageProps) {
  const { id } = params;

  // Use the server action to get the automation by ID
  const automation = await getAutomationById(id);

  // If automation not found, show 404 page
  if (!automation) {
    notFound();
  }

  return <AutomationDetail automation={automation} />;
}
