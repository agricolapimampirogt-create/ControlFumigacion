"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { StageForm } from "@/components/stage-form";
import { getStage } from "@/lib/data";
import type { FumigationStage } from "@/types";

export default function EditarEtapaPage() {
  const params = useParams<{ id: string }>();
  const [stage, setStage] = useState<FumigationStage | null>(null);

  useEffect(() => {
    getStage(params.id).then(setStage);
  }, [params.id]);

  if (!stage) return <p className="text-sm font-medium">Cargando etapa...</p>;
  return <StageForm initial={stage} />;
}
